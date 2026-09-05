import { describe, expect, it } from "vitest";
import {
  createFindingFingerprint,
  normalizeRoute,
  normalizeTargetPath
} from "../../packages/core/src/index.js";

describe("finding fingerprints", () => {
  it("is stable across generated IDs and volatile query parameters", () => {
    const first = createFindingFingerprint({
      route: "https://example.test/checkout?utm_source=test&cart=4&_=171",
      stateLabel: "Dialog Open",
      ruleId: "aria-dialog-name",
      target: "main > div#radix-12345 > button"
    });
    const second = createFindingFingerprint({
      route: "/checkout?cart=4&_=999",
      stateLabel: "dialog open",
      ruleId: "ARIA-DIALOG-NAME",
      target: "main > div#radix-98765 > button"
    });
    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{32}$/);
  });

  it("preserves stable authored IDs", () => {
    expect(normalizeTargetPath("form #billing-email")).toBe(
      "form #billing-email"
    );
    expect(normalizeTargetPath("div#react-select-1234")).toBe("div[id]");
  });

  it("sorts meaningful route parameters", () => {
    expect(normalizeRoute("https://example.test/path/?b=2&a=1#ignored")).toBe(
      "/path?a=1&b=2"
    );
  });
});
