import { describe, expect, it } from "vitest";
import {
  compareReports,
  createFindingFingerprint
} from "../../packages/core/src/index.js";
import { makeFinding, makeReport } from "../helpers/report.js";

describe("compareReports", () => {
  it("keeps unresolved baseline findings visible", () => {
    const finding = makeFinding();
    const comparison = compareReports(
      makeReport([finding]),
      makeReport([{ ...finding }])
    );
    expect(comparison.counts).toEqual({
      new: 0,
      resolved: 0,
      unchanged: 1,
      changedOrUncertain: 0
    });
    expect(comparison.unchanged[0]?.lifecycle).toBe("unchanged");
  });

  it("separates new, resolved, unchanged, and uncertain", () => {
    const unchanged = makeFinding();
    const resolved = makeFinding({
      ruleId: "image-alt",
      target: "#hero",
      fingerprint: createFindingFingerprint({
        route: "/checkout",
        stateLabel: "checkout",
        ruleId: "image-alt",
        target: "#hero"
      })
    });
    const movedBefore = makeFinding({
      ruleId: "color-contrast",
      target: ".old",
      fingerprint: createFindingFingerprint({
        route: "/checkout",
        stateLabel: "checkout",
        ruleId: "color-contrast",
        target: ".old"
      })
    });
    const movedAfter = makeFinding({
      ruleId: "color-contrast",
      target: ".new",
      fingerprint: createFindingFingerprint({
        route: "/checkout",
        stateLabel: "checkout",
        ruleId: "color-contrast",
        target: ".new"
      })
    });
    const added = makeFinding({
      ruleId: "button-name",
      target: "#save",
      fingerprint: createFindingFingerprint({
        route: "/checkout",
        stateLabel: "checkout",
        ruleId: "button-name",
        target: "#save"
      })
    });
    const comparison = compareReports(
      makeReport([unchanged, resolved, movedBefore]),
      makeReport([unchanged, movedAfter, added])
    );
    expect(comparison.counts).toEqual({
      new: 1,
      resolved: 1,
      unchanged: 1,
      changedOrUncertain: 1
    });
  });

  it("refuses to compare reports from different scopes", () => {
    expect(() =>
      compareReports(
        makeReport([makeFinding()]),
        makeReport([makeFinding()], { stateLabel: "different-state" })
      )
    ).toThrow(
      "different route, state, viewport, selector, rule-tag, or engine"
    );
  });
});
