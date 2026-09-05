import { randomUUID } from "node:crypto";
import { compareReports } from "./compare.js";
import { NON_CONFORMANCE_DISCLAIMER, SCHEMA_VERSION } from "./constants.js";
import { normalizeRoute } from "./fingerprint.js";
import type { VerifyRepairOptions } from "./options.js";
import type { AuditReport, VerificationReport } from "./schema.js";
import { verificationReportSchema } from "./schema.js";
import { authenticationMode, redactSecrets } from "./security.js";
import { scanPage } from "./browser.js";

function contextFromAudit(report: AuditReport) {
  return {
    requestedUrl: report.requestedUrl,
    finalUrl: report.finalUrl,
    route: report.route,
    stateLabel: report.stateLabel,
    pageTitle: report.pageTitle,
    viewport: report.viewport,
    browser: report.browser,
    engine: report.engine,
    configuredWcagTags: report.configuredWcagTags,
    selectors: report.selectors,
    authenticationMode: report.authenticationMode,
    findings: report.findings,
    manualReview: report.manualReview,
    executionErrors: report.executionErrors,
    partialResultReasons: report.partialResultReasons,
    complete: report.complete
  };
}

function sameOrigin(left: string, right: string): boolean {
  try {
    return new URL(left).origin === new URL(right).origin;
  } catch {
    return left === right;
  }
}

export async function verifyRepair(
  options: VerifyRepairOptions
): Promise<VerificationReport> {
  const targets =
    options.targetFingerprints ??
    options.baseline.findings.map((finding) => finding.fingerprint);
  const baselineFingerprints = new Set(
    options.baseline.findings.map((finding) => finding.fingerprint)
  );
  const unknownTargets = targets.filter(
    (fingerprint) => !baselineFingerprints.has(fingerprint)
  );
  const base = {
    schemaVersion: SCHEMA_VERSION,
    reportType: "verification" as const,
    runId: randomUUID(),
    timestamp: new Date().toISOString(),
    requestedUrl: redactSecrets(options.url),
    finalUrl: redactSecrets(options.url),
    route: options.routeLabel ?? options.baseline.route,
    stateLabel: options.stateLabel ?? options.baseline.stateLabel,
    pageTitle: options.baseline.pageTitle,
    viewport: options.viewport ?? options.baseline.viewport,
    browser: options.baseline.browser,
    engine: options.baseline.engine,
    configuredWcagTags: options.wcagTags ?? options.baseline.configuredWcagTags,
    selectors: {
      include: options.include ?? options.baseline.selectors.include,
      exclude: options.exclude ?? options.baseline.selectors.exclude
    },
    authenticationMode: authenticationMode(
      options.headers,
      options.storageState
    ),
    findings: options.baseline.findings.map((finding) => ({
      ...finding,
      lifecycle: "unverified" as const
    })),
    manualReview: options.baseline.manualReview,
    executionErrors: [],
    partialResultReasons: ["The verification scan has not completed."],
    complete: false,
    originalFingerprints: targets,
    disclaimer: NON_CONFORMANCE_DISCLAIMER
  };
  try {
    const after = await scanPage({
      ...options,
      stateLabel: options.stateLabel ?? options.baseline.stateLabel
    });
    const stateReproduced =
      options.baseline.complete &&
      after.complete &&
      after.stateLabel === options.baseline.stateLabel &&
      normalizeRoute(after.route) === normalizeRoute(options.baseline.route) &&
      sameOrigin(after.finalUrl, options.baseline.finalUrl) &&
      (options.baseline.stateLabel === "default" ||
        Boolean(options.readySelector));
    const afterFingerprints = new Set(
      after.findings.map((finding) => finding.fingerprint)
    );
    const absentFingerprints = targets.filter(
      (fingerprint) => !afterFingerprints.has(fingerprint)
    );
    const remainingFingerprints = targets.filter((fingerprint) =>
      afterFingerprints.has(fingerprint)
    );
    const comparison = compareReports(options.baseline, after);
    const uncertainTargets = comparison.changedOrUncertain.filter((finding) =>
      targets.includes(finding.before.fingerprint)
    );
    const newSeriousOrCritical = comparison.new.filter(
      (finding) => finding.impact === "serious" || finding.impact === "critical"
    );
    const reasons: string[] = [];
    if (!options.baseline.complete)
      reasons.push("The baseline report is incomplete.");
    if (targets.length === 0)
      reasons.push("No baseline fingerprints were selected for verification.");
    if (unknownTargets.length > 0)
      reasons.push(
        "One or more target fingerprints do not exist in the baseline."
      );
    if (options.baseline.stateLabel !== "default" && !options.readySelector)
      reasons.push(
        "A non-default state requires --ready-selector as observable reproduction evidence."
      );
    if (!stateReproduced)
      reasons.push("The original route/state was not reproduced completely.");
    if (remainingFingerprints.length > 0)
      reasons.push("One or more target fingerprints remain.");
    if (uncertainTargets.length > 0)
      reasons.push(
        "One or more target findings moved or changed and remain uncertain."
      );
    if (newSeriousOrCritical.length > 0)
      reasons.push(
        "New serious or critical findings appeared in the same scope."
      );
    const status =
      stateReproduced &&
      targets.length > 0 &&
      unknownTargets.length === 0 &&
      remainingFingerprints.length === 0 &&
      uncertainTargets.length === 0 &&
      newSeriousOrCritical.length === 0
        ? "verified"
        : "unverified";
    return verificationReportSchema.parse({
      ...base,
      ...contextFromAudit(after),
      complete: after.complete && stateReproduced,
      partialResultReasons: [
        ...after.partialResultReasons,
        ...(stateReproduced
          ? []
          : ["The requested route or state did not match the baseline."])
      ],
      status,
      stateReproduced,
      absentFingerprints,
      remainingFingerprints,
      newSeriousOrCritical,
      evidence: {
        baselineRunId: options.baseline.runId,
        afterRunId: after.runId,
        route: after.route,
        stateLabel: after.stateLabel
      },
      reasons,
      comparison,
      after
    });
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "State reproduction failed.";
    return verificationReportSchema.parse({
      ...base,
      status: "unverified",
      stateReproduced: false,
      absentFingerprints: [],
      remainingFingerprints: targets,
      newSeriousOrCritical: [],
      executionErrors: [
        {
          stage: "state",
          message: redactSecrets(reason),
          recoverable: true
        }
      ],
      partialResultReasons: [
        "The requested page state could not be reproduced and rescanned."
      ],
      evidence: {
        baselineRunId: options.baseline.runId,
        route: options.baseline.route,
        stateLabel: options.baseline.stateLabel
      },
      reasons: [redactSecrets(reason)]
    });
  }
}
