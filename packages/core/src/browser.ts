import { AxeBuilder } from "@axe-core/playwright";
import {
  chromium,
  firefox,
  webkit,
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  type BrowserType,
  type Page,
  type Request
} from "playwright";
import {
  DEFAULT_TIMEOUT_MS,
  DEFAULT_VIEWPORT,
  DEFAULT_WCAG_TAGS,
  MAX_HTML_INPUT_BYTES,
  MAX_LIVE_DOCUMENT_BYTES,
  MAX_REDIRECTS
} from "./constants.js";
import { withBrowserSlot } from "./concurrency.js";
import { normalizeAxeResults } from "./normalize.js";
import type {
  BrowserName,
  ScanHtmlOptions,
  ScanPageOptions
} from "./options.js";
import type { AuditReport } from "./schema.js";
import {
  assertSafeUrl,
  authenticationSensitiveValues,
  authenticationMode,
  redactSecrets
} from "./security.js";

function browserType(name: BrowserName): BrowserType {
  return { chromium, firefox, webkit }[name];
}

function configureAxe(
  page: Page,
  options: { wcagTags?: string[]; include?: string[]; exclude?: string[] }
): AxeBuilder {
  let builder = new AxeBuilder({ page }).withTags(
    options.wcagTags ?? DEFAULT_WCAG_TAGS
  );
  for (const selector of options.include ?? [])
    builder = builder.include(selector);
  for (const selector of options.exclude ?? [])
    builder = builder.exclude(selector);
  return builder;
}

function redirectCount(response: Awaited<ReturnType<Page["goto"]>>): number {
  let count = 0;
  let request = response?.request();
  while (request?.redirectedFrom()) {
    count += 1;
    request = request.redirectedFrom() ?? undefined;
  }
  return count;
}

function redirectCountFromRequest(initial: Request): number {
  let count = 0;
  let request: Request | null = initial;
  while (request?.redirectedFrom()) {
    count += 1;
    request = request.redirectedFrom();
  }
  return count;
}

async function blockAllRequests(context: BrowserContext): Promise<void> {
  await context.route("**/*", async (route) => route.abort("blockedbyclient"));
}

async function makeStaticHtmlInert(
  browser: Browser,
  html: string,
  viewport: { width: number; height: number },
  reducedMotion: "reduce" | "no-preference",
  timeoutMs: number
): Promise<string> {
  const parserContext = await browser.newContext({
    viewport,
    javaScriptEnabled: false,
    reducedMotion
  });
  try {
    await blockAllRequests(parserContext);
    const parserPage = await parserContext.newPage();
    parserPage.setDefaultTimeout(timeoutMs);
    await parserPage.setContent(html, { waitUntil: "domcontentloaded" });
    await parserPage.evaluate(() => {
      document
        .querySelectorAll(
          "script, noscript, iframe, frame, frameset, object, embed, applet, portal, base, meta[http-equiv]"
        )
        .forEach((element) => element.remove());
      for (const element of Array.from(document.querySelectorAll("*"))) {
        for (const attribute of Array.from(element.attributes)) {
          if (
            attribute.name.toLowerCase().startsWith("on") ||
            attribute.name.toLowerCase() === "srcdoc"
          ) {
            element.removeAttribute(attribute.name);
          }
        }
      }
    });
    return await parserPage.content();
  } finally {
    await parserContext.close();
  }
}

export async function scanPage(options: ScanPageOptions): Promise<AuditReport> {
  return withBrowserSlot(async () => {
    const name = options.browserName ?? "chromium";
    const viewport = options.viewport ?? { ...DEFAULT_VIEWPORT };
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
    const sensitiveValues = await authenticationSensitiveValues(
      options.headers,
      options.storageState
    );
    await assertSafeUrl(options.url, options.allowPrivateNetwork ?? false);
    const browser = await browserType(name).launch({ headless: true });
    const securityErrors: string[] = [];
    try {
      const contextOptions: BrowserContextOptions = {
        viewport,
        reducedMotion:
          options.reducedMotion === false ? "no-preference" : "reduce",
        ...(options.storageState ? { storageState: options.storageState } : {}),
        ...(options.headers ? { extraHTTPHeaders: options.headers } : {})
      };
      const context = await browser.newContext(contextOptions);
      await context.route("**/*", async (route) => {
        const requestUrl = route.request().url();
        if (
          !requestUrl.startsWith("http://") &&
          !requestUrl.startsWith("https://")
        ) {
          await route.continue();
          return;
        }
        try {
          if (
            route.request().isNavigationRequest() &&
            redirectCountFromRequest(route.request()) > maxRedirects
          ) {
            throw new Error(`Redirect limit of ${maxRedirects} exceeded.`);
          }
          await assertSafeUrl(requestUrl, options.allowPrivateNetwork ?? false);
          await route.continue();
        } catch (error) {
          securityErrors.push(
            redactSecrets(
              error instanceof Error ? error.message : "Unsafe request blocked."
            )
          );
          await route.abort("blockedbyclient");
        }
      });
      const page = await context.newPage();
      page.setDefaultTimeout(timeoutMs);
      const response = await page.goto(options.url, {
        waitUntil: "domcontentloaded",
        timeout: timeoutMs
      });
      if (redirectCount(response) > maxRedirects)
        throw new Error(`Redirect limit of ${maxRedirects} exceeded.`);
      await assertSafeUrl(page.url(), options.allowPrivateNetwork ?? false);
      if (securityErrors.length > 0)
        throw new Error(`Blocked unsafe page request: ${securityErrors[0]}`);
      const declaredLength = Number(response?.headers()["content-length"] ?? 0);
      if (
        Number.isFinite(declaredLength) &&
        declaredLength > MAX_LIVE_DOCUMENT_BYTES
      ) {
        throw new Error(
          `Document exceeds the ${MAX_LIVE_DOCUMENT_BYTES}-byte response limit.`
        );
      }
      await page.waitForLoadState("load", { timeout: timeoutMs });
      await page.evaluate(
        () =>
          new Promise<void>((resolveFrame) =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() => resolveFrame())
            )
          )
      );
      if (options.readySelector) {
        await page.locator(options.readySelector).waitFor({
          state: "visible",
          timeout: timeoutMs
        });
      }
      const results = await configureAxe(page, options).analyze();
      return normalizeAxeResults({
        results,
        requestedUrl: options.url,
        finalUrl: page.url(),
        routeLabel: options.routeLabel,
        stateLabel: options.stateLabel ?? "default",
        title: await page.title(),
        viewport,
        browser: { name, version: browser.version() },
        wcagTags: options.wcagTags,
        include: options.include,
        exclude: options.exclude,
        authenticationMode: authenticationMode(
          options.headers,
          options.storageState
        ),
        sensitiveValues
      });
    } finally {
      await browser.close();
    }
  });
}

export async function scanHtml(options: ScanHtmlOptions): Promise<AuditReport> {
  if (Buffer.byteLength(options.html, "utf8") > MAX_HTML_INPUT_BYTES) {
    throw new Error(
      `HTML input exceeds the ${MAX_HTML_INPUT_BYTES}-byte limit.`
    );
  }
  return withBrowserSlot(async () => {
    const name = options.browserName ?? "chromium";
    const viewport = options.viewport ?? { ...DEFAULT_VIEWPORT };
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const reducedMotion =
      options.reducedMotion === false ? "no-preference" : "reduce";
    const browser = await browserType(name).launch({ headless: true });
    try {
      const inertHtml = await makeStaticHtmlInert(
        browser,
        options.html,
        viewport,
        reducedMotion,
        timeoutMs
      );
      const context = await browser.newContext({
        viewport,
        reducedMotion
      });
      await blockAllRequests(context);
      const page = await context.newPage();
      page.setDefaultTimeout(timeoutMs);
      await page.setContent(inertHtml, {
        waitUntil: "domcontentloaded"
      });
      const results = await configureAxe(page, options).analyze();
      const label = options.fileLabel ?? "inline.html";
      return normalizeAxeResults({
        results,
        requestedUrl: label,
        finalUrl: "about:blank",
        routeLabel: label,
        stateLabel: options.stateLabel ?? "static-html",
        title: await page.title(),
        viewport,
        browser: { name, version: browser.version() },
        wcagTags: options.wcagTags,
        include: options.include,
        exclude: options.exclude,
        authenticationMode: "none"
      });
    } finally {
      await browser.close();
    }
  });
}
