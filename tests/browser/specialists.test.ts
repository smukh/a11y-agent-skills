import { chromium, type Browser, type Page, type Route } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { scanPage } from "../../packages/core/src/index.js";
import { startFixtureServer } from "../helpers/fixture-server.js";

let browser: Browser;
let server: Awaited<ReturnType<typeof startFixtureServer>>;
beforeAll(async () => {
  server = await startFixtureServer();
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser?.close();
  await server?.close();
});

async function fixture(
  name: string,
  mode: string,
  run: (page: Page) => Promise<void>
) {
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"]
  });
  try {
    const page = await context.newPage();
    await page.goto(`${server.origin}/specialists/${name}-${mode}.html`);
    await run(page);
  } finally {
    await context.close();
  }
}
async function pasteCode(page: Page, value: string) {
  await page.evaluate((value) => navigator.clipboard.writeText(value), value);
  await page.locator("#digit-0").focus();
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+V" : "Control+V"
  );
}

describe("specialist behavioral fixtures", () => {
  for (const mode of ["broken", "repaired"]) {
    it(`${mode}: whole-code clipboard paste determines authentication completion`, async () => {
      await fixture("authentication", mode, async (page) => {
        await pasteCode(page, "012345");
        await page
          .getByRole("button", { name: "Verify code", exact: true })
          .click();
        expect(await page.locator("#auth-status").textContent()).toBe(
          mode === "repaired" ? "Signed in with the test code." : ""
        );
        expect(
          await page
            .locator(".digits input")
            .evaluateAll((inputs) =>
              inputs.map((input) => (input as HTMLInputElement).value).join("")
            )
        ).toBe(mode === "repaired" ? "012345" : "0");
      });
    });
    it(`${mode}: grid save and reorder preserves the edited record's focus`, async () => {
      await fixture("grid", mode, async (page) => {
        await page.keyboard.press("Tab");
        await page.keyboard.press("Enter");
        await page
          .getByRole("spinbutton", { name: "Apples quantity" })
          .fill("5");
        await page.keyboard.press("Enter");
        expect(
          await page
            .locator("#inventory tr")
            .first()
            .getAttribute("data-record")
        ).toBe("pears");
        expect(
          await page
            .locator(":focus")
            .evaluate((element) => element.parentElement?.dataset.record)
        ).toBe(mode === "repaired" ? "apples" : "pears");
        expect(
          await page
            .locator('[data-record="apples"] [data-column="1"]')
            .textContent()
        ).toBe("5");
      });
    });
    it(`${mode}: streaming keeps content and focus while distinguishing interrupting live exposure`, async () => {
      await fixture("dynamic", mode, async (page) => {
        await page.clock.install();
        await page.getByRole("button", { name: "Generate response" }).click();
        await page.clock.runFor(650);
        expect(await page.locator("#answer").textContent()).toBe(
          "Your report is ready."
        );
        expect(await page.locator("#stream-status").textContent()).toBe(
          "Response complete."
        );
        expect(await page.locator(":focus").getAttribute("id")).toBe(
          "generate"
        );
        expect(await page.locator("#answer").getAttribute("aria-live")).toBe(
          mode === "repaired" ? null : "assertive"
        );
        expect(await page.locator("#answer").getAttribute("aria-busy")).toBe(
          "false"
        );
      });
    });
    it(`${mode}: stale autocomplete response cannot replace the current query or active option`, async () => {
      await fixture("combobox", mode, async (page) => {
        const pending = new Map<string, Route>();
        await page.route("**/suggestions.json?*", (route) => {
          pending.set(
            new URL(route.request().url()).searchParams.get("q")!,
            route
          );
        });
        await page.locator("#city").fill("l");
        await expect.poll(() => pending.has("l")).toBe(true);
        await page.locator("#city").fill("lo");
        await expect.poll(() => pending.has("lo")).toBe(true);
        await pending.get("lo")!.fulfill({ json: ["London", "Los Angeles"] });
        await expect.poll(() => page.getByRole("option").count()).toBe(2);
        await page.keyboard.press("ArrowDown");
        const active = await page
          .locator("#city")
          .getAttribute("aria-activedescendant");
        // Wait for the obsolete request's browser-side handler, not a guessed delay.
        await pending.get("l")!.fulfill({ json: ["Lisbon"] });
        await expect
          .poll(() =>
            page.evaluate(
              () =>
                performance
                  .getEntriesByType("resource")
                  .filter((entry) => entry.name.includes("suggestions.json"))
                  .length
            )
          )
          .toBe(2);
        // Two animation frames run after the resolved fetch/json microtasks.
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve())
              )
            )
        );
        expect(await page.getByRole("option").allTextContents()).toEqual(
          mode === "repaired" ? ["London", "Los Angeles"] : ["Lisbon"]
        );
        expect(await page.locator(`[id="${active}"]`).count()).toBe(
          mode === "repaired" ? 1 : 0
        );
        await page.keyboard.press("Enter");
        expect(await page.locator("#selection").textContent()).toBe(
          mode === "repaired" ? "London" : "Lisbon"
        );
      });
    });
    it(`${mode}: chart filter keeps the detailed data equivalent to the visible chart`, async () => {
      await fixture("charts", mode, async (page) => {
        await page.locator("#quarter").focus();
        await page.locator("#quarter").selectOption("q2");
        const visible = await page
          .locator("#bars g")
          .evaluateAll((groups) =>
            groups.map((group) => group.getAttribute("data-value"))
          );
        const table = await page.locator("#sales-data td").allTextContents();
        expect(visible).toEqual(["30", "0"]);
        expect(table).toEqual(mode === "repaired" ? visible : ["10", "20"]);
        expect(await page.locator(":focus").getAttribute("id")).toBe("quarter");
      });
    });
  }

  it("authentication recovers from invalid input, expiry, and resend without losing leading zeroes", async () => {
    await fixture("authentication", "repaired", async (page) => {
      await pasteCode(page, "999999");
      await page
        .getByRole("button", { name: "Verify code", exact: true })
        .click();
      expect(await page.locator("#otp-error").textContent()).toContain(
        "complete six-digit"
      );
      await pasteCode(page, "012345");
      expect(await page.locator("[aria-invalid]").count()).toBe(0);
      await page.getByRole("button", { name: "Simulate expiry" }).click();
      await page
        .getByRole("button", { name: "Verify code", exact: true })
        .click();
      expect(await page.locator("#otp-error").textContent()).toContain(
        "expired"
      );
      await page.getByRole("button", { name: "Resend test code" }).click();
      await pasteCode(page, "012345");
      await page
        .getByRole("button", { name: "Verify code", exact: true })
        .click();
      expect(await page.locator("#auth-status").textContent()).toContain(
        "Signed in"
      );
    });
  });
  it("grid preserves native edit keys, cancellation, and a single tab entry point", async () => {
    await fixture("grid", "repaired", async (page) => {
      await page.keyboard.press("Tab");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await page.getByRole("spinbutton", { name: "Pears quantity" }).fill("9");
      await page.keyboard.press("ArrowLeft");
      expect(await page.locator(":focus").getAttribute("aria-label")).toBe(
        "Pears quantity"
      );
      await page.keyboard.press("Escape");
      expect(
        await page
          .locator('[data-record="pears"] [data-column="1"]')
          .textContent()
      ).toBe("3");
      expect(await page.locator('#inventory [tabindex="0"]').count()).toBe(1);
      await page.keyboard.press("Tab");
      expect(await page.locator(":focus").getAttribute("id")).toBe(
        "after-grid"
      );
    });
  });
  it("stream stop, failure, and retry invalidate pending completion callbacks", async () => {
    await fixture("dynamic", "repaired", async (page) => {
      await page.clock.install();
      await page.locator("#generate").click();
      await page.clock.runFor(170);
      await page.locator("#stop").click();
      const partial = await page.locator("#answer").textContent();
      await page.clock.runFor(1000);
      expect(await page.locator("#answer").textContent()).toBe(partial);
      expect(await page.locator("#stream-status").textContent()).toBe(
        "Response stopped."
      );
      await page.locator("#generate").click();
      await page.locator("#fail").click();
      await page.clock.runFor(1000);
      expect(await page.locator("#stream-status").textContent()).toContain(
        "failed"
      );
      await page.locator("#generate").click();
      await page.clock.runFor(650);
      expect(await page.locator("#stream-status").textContent()).toBe(
        "Response complete."
      );
      expect(await page.locator("#answer").textContent()).toBe(
        "Your report is ready."
      );
    });
  });
  it("combobox handles no results, failure, retry, dismissal, and native text editing", async () => {
    await fixture("combobox", "repaired", async (page) => {
      await page.locator("#city").fill("x");
      await expect
        .poll(() => page.locator("#city-status").textContent())
        .toBe("No cities found.");
      expect(
        await page.locator("#city").getAttribute("aria-activedescendant")
      ).toBeNull();
      await page.route("**/suggestions.json?*", (route) =>
        route.fulfill({ status: 500, body: "Unavailable" })
      );
      await page.locator("#city").fill("lo");
      await expect
        .poll(() => page.locator("#city-status").textContent())
        .toContain("unavailable");
      await page.unroute("**/suggestions.json?*");
      await page.locator("#city").fill("l");
      await expect.poll(() => page.getByRole("option").count()).toBe(3);
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Escape");
      expect(await page.locator("#city").getAttribute("aria-expanded")).toBe(
        "false"
      );
      expect(
        await page.locator("#city").getAttribute("aria-activedescendant")
      ).toBeNull();
      await page.keyboard.press("ArrowLeft");
      expect(
        await page
          .locator("#city")
          .evaluate((element) => (element as HTMLInputElement).selectionStart)
      ).toBe(0);
      await page.keyboard.press("Tab");
      expect(await page.locator(":focus").getAttribute("id")).toBe(
        "after-city"
      );
    });
  });
  it("chart empty and reset states preserve data meaning", async () => {
    await fixture("charts", "repaired", async (page) => {
      await page.locator("#quarter").selectOption("empty");
      expect(await page.locator("#sales-data tr").count()).toBe(0);
      expect(await page.locator("#bars g").count()).toBe(0);
      expect(await page.locator("#chart-summary").textContent()).toContain(
        "No sales data"
      );
      await page.locator("#quarter").selectOption("q1");
      expect(await page.locator("#sales-data td").allTextContents()).toEqual([
        "10",
        "20"
      ]);
      expect(await page.locator("#data-caption").textContent()).toBe(
        "Sales in Q1, units"
      );
    });
  });
  it("negative controls retain usable native entry, selection, and disclosure", async () => {
    const page = await browser.newPage();
    try {
      await page.goto(`${server.origin}/specialists/negative-controls.html`);
      await page.locator("#code").fill("012345");
      expect(await page.locator("#code").inputValue()).toBe("012345");
      await page.getByLabel("Region").selectOption("South");
      expect(await page.getByLabel("Region").inputValue()).toBe("South");
      await page.getByText("Delivery information", { exact: true }).focus();
      await page.keyboard.press("Enter");
      expect(
        await page.getByText("Delivery takes two working days.").isVisible()
      ).toBe(true);
      expect(
        await page
          .locator('[role="grid"], [aria-live], [aria-activedescendant]')
          .count()
      ).toBe(0);
    } finally {
      await page.close();
    }
  });
  it("specialist repaired fixtures and negative controls have no serious or critical axe findings", async () => {
    for (const name of [
      "authentication",
      "grid",
      "dynamic",
      "combobox",
      "charts",
      "negative-controls"
    ]) {
      const file = name === "negative-controls" ? name : `${name}-repaired`;
      const report = await scanPage({
        url: `${server.origin}/specialists/${file}.html`,
        stateLabel: file,
        allowPrivateNetwork: true
      });
      expect(
        report.findings.filter((finding) =>
          ["serious", "critical"].includes(finding.impact ?? "")
        ),
        file
      ).toEqual([]);
    }
  });
});
