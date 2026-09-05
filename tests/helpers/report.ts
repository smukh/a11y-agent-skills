import { randomUUID } from "node:crypto";
import {
  NON_CONFORMANCE_DISCLAIMER,
  SCHEMA_VERSION,
  auditReportSchema,
  createFindingFingerprint,
  type AuditReport,
  type Finding
} from "../../packages/core/src/index.js";

export function makeFinding(overrides: Partial<Finding> = {}): Finding {
  const ruleId = overrides.ruleId ?? "label";
  const target = overrides.target ?? "#email";
  const pageLabel = overrides.pageLabel ?? "checkout";
  return {
    fingerprint:
      overrides.fingerprint ??
      createFindingFingerprint({
        route: "/checkout",
        stateLabel: pageLabel,
        ruleId,
        target
      }),
    ruleId,
    ruleSource: "axe-core",
    impact: "serious",
    wcagMappings: [{ id: "wcag412", source: "axe-core" }],
    ruleTags: ["wcag2a", "wcag412"],
    description: "Test description",
    target,
    normalizedTarget: target,
    htmlEvidence: '<input id="email">',
    failureSummary: "Fix the test failure.",
    helpUrl: "https://dequeuniversity.com/rules/axe/4.10/label",
    pageLabel,
    detectedBy: "automated",
    lifecycle: "remaining",
    ...overrides
  };
}

export function makeReport(
  findings: Finding[],
  overrides: Partial<AuditReport> = {}
): AuditReport {
  return auditReportSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    reportType: "audit",
    runId: randomUUID(),
    timestamp: new Date().toISOString(),
    requestedUrl: "https://example.test/checkout",
    finalUrl: "https://example.test/checkout",
    route: "/checkout",
    stateLabel: "checkout",
    pageTitle: "Checkout",
    viewport: { width: 1280, height: 720 },
    browser: { name: "chromium", version: "test" },
    engine: { name: "axe-core", version: "test" },
    configuredWcagTags: ["wcag2a", "wcag2aa"],
    selectors: { include: [], exclude: [] },
    authenticationMode: "none",
    findings,
    manualReview: [],
    executionErrors: [],
    partialResultReasons: [],
    complete: true,
    disclaimer: NON_CONFORMANCE_DISCLAIMER,
    ...overrides
  });
}
