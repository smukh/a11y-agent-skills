import { randomUUID } from "node:crypto";
import { NON_CONFORMANCE_DISCLAIMER, SCHEMA_VERSION } from "./constants.js";
import type { AuditReport, ComparisonReport, Finding } from "./schema.js";
import { auditReportSchema, comparisonReportSchema } from "./schema.js";
import { normalizeRoute } from "./fingerprint.js";

function normalizedList(values: string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function scopeSignature(report: AuditReport): string {
  return JSON.stringify({
    route: normalizeRoute(report.route),
    stateLabel: report.stateLabel,
    viewport: report.viewport,
    configuredWcagTags: normalizedList(report.configuredWcagTags),
    include: normalizedList(report.selectors.include),
    exclude: normalizedList(report.selectors.exclude),
    engine: report.engine.name
  });
}

function contentSignature(finding: Finding): string {
  return JSON.stringify({
    ruleId: finding.ruleId,
    impact: finding.impact,
    target: finding.normalizedTarget,
    summary: finding.failureSummary,
    description: finding.description,
    mappings: finding.wcagMappings
  });
}

function identity(finding: Finding): string {
  return `${finding.pageLabel}\0${finding.ruleId}`;
}

function withLifecycle(
  finding: Finding,
  lifecycle: Finding["lifecycle"]
): Finding {
  return { ...finding, lifecycle };
}

export function compareReports(
  beforeInput: AuditReport,
  afterInput: AuditReport
): ComparisonReport {
  const before = auditReportSchema.parse(beforeInput);
  const after = auditReportSchema.parse(afterInput);
  if (scopeSignature(before) !== scopeSignature(after)) {
    throw new Error(
      "Audit reports use different route, state, viewport, selector, rule-tag, or engine scopes."
    );
  }
  const beforeByFingerprint = new Map(
    before.findings.map((finding) => [finding.fingerprint, finding])
  );
  const afterByFingerprint = new Map(
    after.findings.map((finding) => [finding.fingerprint, finding])
  );
  const unchanged: Finding[] = [];
  const changedOrUncertain: ComparisonReport["changedOrUncertain"] = [];
  const unmatchedBefore: Finding[] = [];
  const unmatchedAfter: Finding[] = [];

  for (const finding of before.findings) {
    const matched = afterByFingerprint.get(finding.fingerprint);
    if (!matched) {
      unmatchedBefore.push(finding);
    } else if (contentSignature(finding) === contentSignature(matched)) {
      unchanged.push(withLifecycle(matched, "unchanged"));
    } else {
      changedOrUncertain.push({
        before: withLifecycle(finding, "unverified"),
        after: withLifecycle(matched, "unverified"),
        reason:
          "The stable location matches, but impact, evidence, mappings, or failure details changed."
      });
    }
  }
  for (const finding of after.findings) {
    if (!beforeByFingerprint.has(finding.fingerprint))
      unmatchedAfter.push(finding);
  }

  const stillAfter = new Set(unmatchedAfter);
  const stillBefore = new Set(unmatchedBefore);
  for (const prior of unmatchedBefore) {
    const candidates = unmatchedAfter.filter(
      (candidate) =>
        stillAfter.has(candidate) && identity(candidate) === identity(prior)
    );
    if (candidates.length === 1) {
      const candidate = candidates[0];
      if (!candidate) continue;
      stillBefore.delete(prior);
      stillAfter.delete(candidate);
      changedOrUncertain.push({
        before: withLifecycle(prior, "unverified"),
        after: withLifecycle(candidate, "unverified"),
        reason:
          "The same rule remains in this state, but its normalized target moved; classification is uncertain."
      });
    }
  }

  const resolved = [...stillBefore].map((finding) =>
    withLifecycle(finding, "resolved")
  );
  const added = [...stillAfter].map((finding) => withLifecycle(finding, "new"));
  const sort = (a: Finding, b: Finding) =>
    a.fingerprint.localeCompare(b.fingerprint);
  added.sort(sort);
  resolved.sort(sort);
  unchanged.sort(sort);
  changedOrUncertain.sort((a, b) =>
    a.before.fingerprint.localeCompare(b.before.fingerprint)
  );

  return comparisonReportSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    reportType: "comparison",
    runId: randomUUID(),
    timestamp: new Date().toISOString(),
    requestedUrl: after.requestedUrl,
    finalUrl: after.finalUrl,
    route: after.route,
    stateLabel: after.stateLabel,
    pageTitle: after.pageTitle,
    viewport: after.viewport,
    browser: after.browser,
    engine: after.engine,
    configuredWcagTags: after.configuredWcagTags,
    selectors: after.selectors,
    authenticationMode: after.authenticationMode,
    findings: after.findings,
    manualReview: after.manualReview,
    executionErrors: [
      ...before.executionErrors.map((error) => ({
        ...error,
        message: `baseline: ${error.message}`
      })),
      ...after.executionErrors.map((error) => ({
        ...error,
        message: `current: ${error.message}`
      }))
    ],
    partialResultReasons: [
      ...before.partialResultReasons.map((reason) => `baseline: ${reason}`),
      ...after.partialResultReasons.map((reason) => `current: ${reason}`)
    ],
    complete: before.complete && after.complete,
    beforeRunId: before.runId,
    afterRunId: after.runId,
    new: added,
    resolved,
    unchanged,
    changedOrUncertain,
    counts: {
      new: added.length,
      resolved: resolved.length,
      unchanged: unchanged.length,
      changedOrUncertain: changedOrUncertain.length
    },
    disclaimer: NON_CONFORMANCE_DISCLAIMER
  });
}
