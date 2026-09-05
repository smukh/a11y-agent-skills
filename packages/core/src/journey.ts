import { randomUUID } from "node:crypto";
import {
  chromium,
  firefox,
  webkit,
  type BrowserContextOptions,
  type BrowserType,
  type Locator,
  type Page,
  type Request
} from "playwright";
import {
  DEFAULT_TIMEOUT_MS,
  DEFAULT_VIEWPORT,
  MAX_REDIRECTS,
  NON_CONFORMANCE_DISCLAIMER,
  SCHEMA_VERSION
} from "./constants.js";
import { withBrowserSlot } from "./concurrency.js";
import { normalizeRoute } from "./fingerprint.js";
import type { BrowserName, RunKeyboardJourneyOptions } from "./options.js";
import type { JourneyAction, JourneyReport } from "./schema.js";
import { journeyReportSchema, keyboardJourneySchema } from "./schema.js";
import {
  assertSafeUrl,
  authenticationSensitiveValues,
  authenticationMode,
  redactSecrets
} from "./security.js";

function browserType(name: BrowserName): BrowserType {
  return { chromium, firefox, webkit }[name];
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

function targetLocator(
  page: Page,
  target: Extract<JourneyAction, { target: unknown }>["target"]
): Locator {
  if ("selector" in target) return page.locator(target.selector).first();
  return page
    .getByRole(
      target.role as Parameters<Page["getByRole"]>[0],
      target.name ? { name: target.name } : {}
    )
    .first();
}

function nameFromAriaSnapshot(snapshot: string): string {
  const match = /^\s*-\s+[^\s:]+\s+"((?:\\.|[^"])*)"/m.exec(snapshot);
  if (!match?.[1]) return "";
  try {
    return JSON.parse(`"${match[1]}"`) as string;
  } catch {
    return match[1];
  }
}

async function computedAccessibleName(locator: Locator): Promise<string> {
  return nameFromAriaSnapshot(await locator.ariaSnapshot({ timeout: 1_000 }));
}

async function focusEvidence(
  page: Page
): Promise<{ selector: string; name: string }> {
  const selector = await page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (!element || element === document.body) return "body";
    const escape = (value: string) =>
      globalThis.CSS?.escape
        ? globalThis.CSS.escape(value)
        : value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
    const parts: string[] = [];
    let current: HTMLElement | null = element;
    while (current && current !== document.body && parts.length < 6) {
      let part = current.tagName.toLowerCase();
      if (current.id) {
        part += `#${escape(current.id)}`;
        parts.unshift(part);
        break;
      }
      const parent: HTMLElement | null = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (candidate) => candidate.tagName === current?.tagName
        );
        if (siblings.length > 1)
          part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      }
      parts.unshift(part);
      current = parent;
    }
    return parts.join(" > ") || element.tagName.toLowerCase();
  });
  if (selector === "body") return { selector, name: "" };
  try {
    return {
      selector,
      name: await computedAccessibleName(page.locator(selector))
    };
  } catch {
    return { selector, name: "" };
  }
}

function safeAction(action: JourneyAction): JourneyAction {
  return action.type === "fill"
    ? { ...action, value: "[REDACTED INPUT]" }
    : action;
}

async function executeAction(
  page: Page,
  action: JourneyAction,
  allowPrivateNetwork: boolean
): Promise<void> {
  switch (action.type) {
    case "navigate":
      await assertSafeUrl(action.url, allowPrivateNetwork);
      await page.goto(action.url, { waitUntil: "domcontentloaded" });
      await assertSafeUrl(page.url(), allowPrivateNetwork);
      return;
    case "click":
      await targetLocator(page, action.target).click();
      return;
    case "press":
      await page.keyboard.press(action.key);
      return;
    case "fill":
      await targetLocator(page, action.target).fill(action.value);
      return;
    case "waitFor":
      await page.locator(action.selector).waitFor({
        state: "visible",
        ...(action.timeoutMs === undefined ? {} : { timeout: action.timeoutMs })
      });
      return;
    case "assertFocus":
    case "assertFocusReturned": {
      const matches = await targetLocator(page, action.target).evaluate(
        (element) => element === document.activeElement
      );
      if (!matches) throw new Error("Expected target does not have focus.");
      return;
    }
    case "assertAccessibleName": {
      const target = targetLocator(page, action.target);
      const actual = await computedAccessibleName(target);
      if (actual !== action.name)
        throw new Error("Target does not have the expected accessible name.");
      return;
    }
    case "assertVisible": {
      const visible = await targetLocator(page, action.target).isVisible();
      if (visible !== action.visible)
        throw new Error(
          `Expected visibility ${action.visible}, received ${visible}.`
        );
      return;
    }
    case "assertFocusWithin": {
      const within = await page
        .locator(action.selector)
        .evaluate((element) => element.contains(document.activeElement));
      if (!within) throw new Error("Focus escaped the expected container.");
      return;
    }
  }
}

export async function runKeyboardJourney(
  options: RunKeyboardJourneyOptions
): Promise<JourneyReport> {
  const journey = keyboardJourneySchema.parse(options.journey);
  return withBrowserSlot(async () => {
    const name = options.browserName ?? "chromium";
    const viewport = options.viewport ?? { ...DEFAULT_VIEWPORT };
    const allowPrivateNetwork = options.allowPrivateNetwork ?? false;
    const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
    const sensitiveValues = [
      ...(await authenticationSensitiveValues(
        options.headers,
        options.storageState
      )),
      ...journey.actions.flatMap((action) =>
        action.type === "fill" ? [action.value] : []
      )
    ];
    await assertSafeUrl(options.url, allowPrivateNetwork);
    const browser = await browserType(name).launch({ headless: true });
    try {
      const contextOptions: BrowserContextOptions = {
        viewport,
        reducedMotion:
          options.reducedMotion === false ? "no-preference" : "reduce",
        ...(options.storageState ? { storageState: options.storageState } : {}),
        ...(options.headers ? { extraHTTPHeaders: options.headers } : {})
      };
      const context = await browser.newContext(contextOptions);
      const securityErrors: string[] = [];
      await context.route("**/*", async (route) => {
        const value = route.request().url();
        if (!value.startsWith("http://") && !value.startsWith("https://")) {
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
          await assertSafeUrl(value, allowPrivateNetwork);
          await route.continue();
        } catch (error) {
          securityErrors.push(
            error instanceof Error ? error.message : "Unsafe request blocked."
          );
          await route.abort("blockedbyclient");
        }
      });
      const page = await context.newPage();
      page.setDefaultTimeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
      await page.goto(options.url, { waitUntil: "domcontentloaded" });
      await assertSafeUrl(page.url(), allowPrivateNetwork);
      if (securityErrors.length > 0) throw new Error(securityErrors[0]);
      await page.waitForLoadState("load", {
        timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS
      });
      const steps: JourneyReport["steps"] = [];
      let failed = false;
      for (const [index, action] of journey.actions.entries()) {
        const started = performance.now();
        if (failed) {
          const evidence = await focusEvidence(page);
          steps.push({
            index,
            action: safeAction(action),
            status: "skipped",
            focusedElement: evidence.selector,
            accessibleName: redactSecrets(evidence.name, sensitiveValues),
            failureReason: "Skipped after an earlier failure.",
            durationMs: Math.max(0, performance.now() - started)
          });
          continue;
        }
        try {
          await executeAction(page, action, allowPrivateNetwork);
          const evidence = await focusEvidence(page);
          steps.push({
            index,
            action: safeAction(action),
            status: "passed",
            focusedElement: evidence.selector,
            accessibleName: redactSecrets(evidence.name, sensitiveValues),
            durationMs: Math.max(0, performance.now() - started)
          });
        } catch (error) {
          failed = true;
          const evidence = await focusEvidence(page);
          steps.push({
            index,
            action: safeAction(action),
            status: "failed",
            focusedElement: evidence.selector,
            accessibleName: redactSecrets(evidence.name, sensitiveValues),
            failureReason: redactSecrets(
              error instanceof Error ? error.message : "Journey action failed.",
              sensitiveValues
            ),
            durationMs: Math.max(0, performance.now() - started)
          });
        }
      }
      return journeyReportSchema.parse({
        schemaVersion: SCHEMA_VERSION,
        reportType: "keyboard-journey",
        runId: randomUUID(),
        timestamp: new Date().toISOString(),
        journeyName: journey.name,
        requestedUrl: redactSecrets(options.url, sensitiveValues),
        finalUrl: redactSecrets(page.url(), sensitiveValues),
        route: normalizeRoute(page.url()),
        stateLabel: journey.stateLabel,
        pageTitle: redactSecrets(await page.title(), sensitiveValues),
        viewport,
        browser: { name, version: browser.version() },
        engine: {
          name: "playwright-keyboard-journey",
          version: browser.version()
        },
        configuredWcagTags: [],
        selectors: { include: [], exclude: [] },
        authenticationMode: authenticationMode(
          options.headers,
          options.storageState
        ),
        findings: [],
        steps,
        passed: !failed,
        executionErrors: [],
        partialResultReasons: failed
          ? ["Remaining actions were skipped after the first failed step."]
          : [],
        complete: !failed,
        manualReview: [
          {
            id: "real-input-and-at",
            description:
              "Repeat representative tasks with physical input and applicable assistive technologies.",
            reason:
              "A scripted browser journey cannot establish every input or assistive-technology outcome.",
            status: "required"
          }
        ],
        disclaimer: NON_CONFORMANCE_DISCLAIMER
      });
    } finally {
      await browser.close();
    }
  });
}
