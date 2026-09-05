import type {
  AuditReport,
  ComparisonReport,
  JourneyReport,
  VerificationReport
} from "./schema.js";
import { redactSecrets } from "./security.js";

export type AnyReport =
  AuditReport | ComparisonReport | VerificationReport | JourneyReport;

function deepRedact(value: unknown): unknown {
  if (typeof value === "string") return redactSecrets(value);
  if (Array.isArray(value)) return value.map(deepRedact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, deepRedact(child)])
    );
  }
  return value;
}

export function formatJson(report: AnyReport): string {
  return `${JSON.stringify(deepRedact(report), null, 2)}\n`;
}

function findingLine(finding: AuditReport["findings"][number]): string {
  return `- **${finding.impact} · ${finding.ruleId}** at \`${finding.target}\` (${finding.lifecycle})`;
}

export function formatMarkdown(report: AnyReport): string {
  const lines = [`# Accessibility ${report.reportType} report`, ""];
  if (report.reportType === "audit") {
    lines.push(
      `- State: \`${report.stateLabel}\``,
      `- URL: ${report.finalUrl}`,
      `- Findings: ${report.findings.length}`,
      "",
      "## Findings",
      ""
    );
    lines.push(
      ...(report.findings.length
        ? report.findings.map(findingLine)
        : ["No automated findings in the configured scope."])
    );
    lines.push(
      "",
      "## Manual review",
      "",
      ...report.manualReview.map(
        (item) => `- **${item.status}**: ${item.description}`
      )
    );
  } else if (report.reportType === "comparison") {
    lines.push(
      `- New: ${report.counts.new}`,
      `- Resolved: ${report.counts.resolved}`,
      `- Unchanged: ${report.counts.unchanged}`,
      `- Changed or uncertain: ${report.counts.changedOrUncertain}`,
      "",
      "## New",
      "",
      ...(report.new.length ? report.new.map(findingLine) : ["None."]),
      "",
      "## Resolved",
      "",
      ...(report.resolved.length
        ? report.resolved.map(findingLine)
        : ["None."]),
      "",
      "## Unchanged",
      "",
      ...(report.unchanged.length
        ? report.unchanged.map(findingLine)
        : ["None."]),
      "",
      "## Changed or uncertain",
      "",
      ...(report.changedOrUncertain.length
        ? report.changedOrUncertain.map(
            (item) =>
              `- **${item.after.impact} · ${item.after.ruleId}**: ${item.reason}`
          )
        : ["None."])
    );
  } else if (report.reportType === "verification") {
    lines.push(
      `- Status: **${report.status}**`,
      `- Original state reproduced: ${report.stateReproduced ? "yes" : "no"}`,
      `- Target fingerprints absent: ${report.absentFingerprints.length}`,
      `- Target fingerprints remaining: ${report.remainingFingerprints.length}`,
      `- New serious/critical findings: ${report.newSeriousOrCritical.length}`,
      "",
      "## Reasons",
      "",
      ...(report.reasons.length
        ? report.reasons.map((reason) => `- ${reason}`)
        : ["All verification requirements passed."])
    );
  } else {
    lines.push(
      `- Journey: ${report.journeyName}`,
      `- State: \`${report.stateLabel}\``,
      `- Result: **${report.passed ? "passed" : "failed"}**`,
      "",
      "## Steps",
      "",
      ...report.steps.map(
        (step) =>
          `- ${step.index + 1}. **${step.status}** ${step.action.type}; focus \`${step.focusedElement}\`${step.failureReason ? ` — ${step.failureReason}` : ""}`
      )
    );
  }
  lines.push("", `> ${report.disclaimer}`, "");
  return redactSecrets(lines.join("\n"));
}

export function formatSarif(report: AnyReport): string {
  const findings =
    report.reportType === "audit"
      ? report.findings
      : report.reportType === "comparison"
        ? report.new
        : report.reportType === "verification"
          ? report.newSeriousOrCritical
          : [];
  const rules = [
    ...new Map(findings.map((finding) => [finding.ruleId, finding])).values()
  ].map((finding) => ({
    id: finding.ruleId,
    name: finding.ruleId,
    shortDescription: { text: finding.description },
    helpUri: finding.helpUrl,
    properties: { source: finding.ruleSource, tags: finding.ruleTags }
  }));
  const results = findings.map((finding) => ({
    ruleId: finding.ruleId,
    level:
      finding.impact === "critical" || finding.impact === "serious"
        ? "error"
        : finding.impact === "moderate"
          ? "warning"
          : "note",
    message: { text: finding.failureSummary },
    locations: [
      {
        logicalLocations: [{ name: finding.target, kind: "element" }]
      }
    ],
    partialFingerprints: { a11yAgentFingerprint: finding.fingerprint },
    properties: {
      impact: finding.impact,
      lifecycle: finding.lifecycle,
      detectedBy: finding.detectedBy
    }
  }));
  return `${JSON.stringify(
    deepRedact({
      $schema: "https://json.schemastore.org/sarif-2.1.0.json",
      version: "2.1.0",
      runs: [
        {
          tool: {
            driver: {
              name: "a11y-agent",
              rules
            }
          },
          results,
          invocations: [
            {
              executionSuccessful: report.complete,
              toolExecutionNotifications: [
                { level: "note", message: { text: report.disclaimer } }
              ]
            }
          ]
        }
      ]
    }),
    null,
    2
  )}\n`;
}
