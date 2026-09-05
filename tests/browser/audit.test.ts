import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  compareReports,
  scanHtml,
  scanPage,
  verifyRepair
} from "../../packages/core/src/index.js";
import { startFixtureServer } from "../helpers/fixture-server.js";

let server: Awaited<ReturnType<typeof startFixtureServer>> | undefined;
let reactServer: Awaited<ReturnType<typeof startFixtureServer>> | undefined;
beforeAll(async () => {
  server = await startFixtureServer();
  await promisify(execFile)(
    "pnpm",
    ["--filter", "@a11y-agent/react-fixture", "build"],
    { cwd: process.cwd() }
  );
  reactServer = await startFixtureServer("fixtures/react/dist");
});
afterAll(async () => {
  await Promise.all([server?.close(), reactServer?.close()]);
});

describe("rendered fixture audit", () => {
  it("finds deterministic failures with stable fingerprints and resolves the repaired rules", async () => {
    if (!server) throw new Error("Static fixture server did not start.");
    const options = {
      routeLabel: "/gallery",
      stateLabel: "gallery",
      allowPrivateNetwork: true,
      wcagTags: [
        "wcag2a",
        "wcag2aa",
        "wcag21a",
        "wcag21aa",
        "wcag22aa",
        "best-practice"
      ]
    };
    const first = await scanPage({
      url: `${server.origin}/gallery-broken.html`,
      ...options
    });
    const repeated = await scanPage({
      url: `${server.origin}/gallery-broken.html`,
      ...options
    });
    const repaired = await scanPage({
      url: `${server.origin}/gallery-repaired.html`,
      ...options
    });
    const rules = new Set(first.findings.map((finding) => finding.ruleId));
    for (const expected of [
      "image-alt",
      "label",
      "color-contrast",
      "heading-order",
      "landmark-one-main"
    ]) {
      expect(rules.has(expected), `missing expected rule ${expected}`).toBe(
        true
      );
    }
    expect(first.findings.map((finding) => finding.fingerprint)).toEqual(
      repeated.findings.map((finding) => finding.fingerprint)
    );
    const comparison = compareReports(first, repaired);
    const repairedRuleIds = new Set(
      repaired.findings.map((finding) => finding.ruleId)
    );
    for (const expected of [
      "image-alt",
      "label",
      "color-contrast",
      "heading-order",
      "landmark-one-main"
    ]) {
      expect(
        repairedRuleIds.has(expected),
        `repaired fixture still has ${expected}`
      ).toBe(false);
    }
    expect(comparison.resolved.length).toBeGreaterThan(0);
    const verification = await verifyRepair({
      url: `${server.origin}/gallery-repaired.html`,
      baseline: first,
      ...options,
      readySelector: "#main"
    });
    expect(verification.status).toBe("verified");
    const unknownTarget = await verifyRepair({
      url: `${server.origin}/gallery-repaired.html`,
      baseline: first,
      ...options,
      readySelector: "#main",
      targetFingerprints: ["00000000000000000000000000000000"]
    });
    expect(unknownTarget.status).toBe("unverified");
    expect(unknownTarget.reasons).toContain(
      "One or more target fingerprints do not exist in the baseline."
    );
  });

  it("audits a rendered React page and resolves its deterministic findings", async () => {
    if (!reactServer) throw new Error("React fixture server did not start.");
    const options = {
      routeLabel: "/react-gallery",
      stateLabel: "react-gallery",
      allowPrivateNetwork: true,
      readySelector: ".card",
      wcagTags: ["wcag2a", "wcag2aa", "best-practice"]
    };
    const broken = await scanPage({
      url: `${reactServer.origin}/`,
      ...options
    });
    const repaired = await scanPage({
      url: `${reactServer.origin}/?repaired`,
      ...options
    });
    const brokenRuleIds = new Set(
      broken.findings.map((finding) => finding.ruleId)
    );
    for (const expected of [
      "image-alt",
      "label",
      "color-contrast",
      "heading-order",
      "landmark-one-main"
    ]) {
      expect(
        brokenRuleIds.has(expected),
        `React fixture is missing ${expected}`
      ).toBe(true);
    }
    expect(compareReports(broken, repaired).resolved.length).toBeGreaterThan(0);
    expect(repaired.findings).toHaveLength(0);
  });

  it("does not turn unusual accessible controls into serious regressions", async () => {
    if (!server) throw new Error("Static fixture server did not start.");
    const report = await scanPage({
      url: `${server.origin}/negative-controls.html`,
      stateLabel: "negative-controls",
      allowPrivateNetwork: true
    });
    expect(
      report.findings.filter(
        (finding) =>
          finding.impact === "serious" || finding.impact === "critical"
      )
    ).toEqual([]);
  });

  it("parses static HTML without executing embedded JavaScript", async () => {
    const report = await scanHtml({
      html: `<!doctype html><html lang="en"><head><title>Safe title</title><script>document.title = "Executed"; document.querySelector("input")?.setAttribute("aria-label", "Injected");</script></head><body><main><input id="email"></main></body></html>`,
      fileLabel: "untrusted.html"
    });
    expect(report.pageTitle).toBe("Safe title");
    expect(report.findings.some((finding) => finding.ruleId === "label")).toBe(
      true
    );
  });
});
