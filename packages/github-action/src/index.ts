import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DefaultArtifactClient } from "@actions/artifact";
import * as core from "@actions/core";
import {
  auditReportSchema,
  compareReports,
  findingsAtOrAbove,
  formatJson,
  formatSarif,
  scanPage,
  type AnyReport,
  type FailureThreshold
} from "@a11y-agent/core";

const thresholds = new Set<FailureThreshold>([
  "none",
  "minor",
  "moderate",
  "serious",
  "critical"
]);

async function run(): Promise<void> {
  const url = core.getInput("url", { required: true });
  const stateLabel = core.getInput("state-label") || "default";
  const routeLabel = core.getInput("route-label");
  const readySelector = core.getInput("ready-selector");
  const tags = (
    core.getInput("axe-tags") || "wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa"
  )
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const threshold = core.getInput("fail-on") as FailureThreshold;
  if (!thresholds.has(threshold))
    throw new Error(`Unsupported fail-on threshold: ${threshold}`);
  const outputDirectory = resolve(
    core.getInput("output-directory") || ".a11y-agent/action"
  );
  await mkdir(outputDirectory, { recursive: true });

  const after = await scanPage({
    url,
    stateLabel,
    wcagTags: tags,
    allowPrivateNetwork: core.getBooleanInput("allow-private-network"),
    ...(routeLabel ? { routeLabel } : {}),
    ...(readySelector ? { readySelector } : {})
  });
  const baselinePath = core.getInput("baseline");
  let report: AnyReport = after;
  let candidates = after.findings;
  if (baselinePath) {
    const baseline = auditReportSchema.parse(
      JSON.parse(await readFile(resolve(baselinePath), "utf8")) as unknown
    );
    const comparison = compareReports(baseline, after);
    report = comparison;
    candidates = comparison.new;
  }

  const jsonPath = resolve(outputDirectory, "a11y-agent-report.json");
  const sarifPath = resolve(outputDirectory, "a11y-agent-report.sarif");
  await Promise.all([
    writeFile(jsonPath, formatJson(report), { encoding: "utf8", mode: 0o600 }),
    writeFile(sarifPath, formatSarif(report), { encoding: "utf8", mode: 0o600 })
  ]);
  const artifact = new DefaultArtifactClient();
  await artifact.uploadArtifact(
    "a11y-agent-reports",
    [jsonPath, sarifPath],
    outputDirectory
  );

  const counts =
    report.reportType === "comparison"
      ? report.counts
      : {
          new: report.findings.length,
          resolved: 0,
          unchanged: 0,
          changedOrUncertain: 0
        };
  await core.summary
    .addHeading("a11y-agent accessibility evidence")
    .addTable([
      [
        { data: "New", header: true },
        { data: "Resolved", header: true },
        { data: "Unchanged", header: true },
        { data: "Changed/uncertain", header: true }
      ],
      [
        String(counts.new),
        String(counts.resolved),
        String(counts.unchanged),
        String(counts.changedOrUncertain)
      ]
    ])
    .addQuote(
      "Automated and agent-assisted testing identifies a subset of accessibility barriers. This result is not a declaration of WCAG conformance."
    )
    .write();
  const failures = findingsAtOrAbove(candidates, threshold);
  if (failures.length > 0)
    core.setFailed(
      `${failures.length} new finding(s) met the explicit ${threshold} threshold.`
    );
}

run().catch((error: unknown) =>
  core.setFailed(
    error instanceof Error ? error.message : "a11y-agent Action failed."
  )
);
