import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import {
  auditReportSchema,
  compareReports,
  journeyReportSchema
} from "../packages/core/src/index.js";

interface CatalogCase {
  id: string;
  deterministicRulesExpected: string[];
  behaviorAssertionsExpected: string[];
  prohibitedFixes: string[];
}

const prohibitedCategories = new Set([
  "unnecessary-aria",
  "removed-functionality",
  "hidden-content",
  "fabricated-content",
  "scanner-suppression"
]);

interface ReviewEvidence {
  schemaVersion: "1.0.0";
  reviewer: string;
  prohibitedOrMisleadingFixes: string[];
  notes: string[];
}

async function reviewEvidence(path: string): Promise<ReviewEvidence> {
  const candidate = JSON.parse(
    await readFile(resolve(path), "utf8")
  ) as Partial<ReviewEvidence>;
  if (
    candidate.schemaVersion !== "1.0.0" ||
    typeof candidate.reviewer !== "string" ||
    candidate.reviewer.length === 0 ||
    !Array.isArray(candidate.prohibitedOrMisleadingFixes) ||
    !candidate.prohibitedOrMisleadingFixes.every((value) =>
      prohibitedCategories.has(value)
    ) ||
    !Array.isArray(candidate.notes) ||
    !candidate.notes.every((value) => typeof value === "string")
  ) {
    throw new Error("Review evidence does not match evals/review-schema.json.");
  }
  return candidate as ReviewEvidence;
}

function args(): Record<string, string> {
  const parsed: Record<string, string> = {};
  const start = process.argv[2] === "--" ? 3 : 2;
  for (let index = start; index < process.argv.length; index += 2) {
    const key = process.argv[index];
    const value = process.argv[index + 1];
    if (!key?.startsWith("--") || !value)
      throw new Error("Arguments use --name value pairs.");
    parsed[key.slice(2)] = value;
  }
  return parsed;
}

const options = args();
for (const required of ["before", "after", "case", "model"] as const) {
  if (!options[required]) throw new Error(`Missing --${required}.`);
}
const catalog = JSON.parse(
  await readFile(resolve("evals/cases/catalog.json"), "utf8")
) as {
  fixtureRevision: string;
  cases: CatalogCase[];
};
const selected = catalog.cases.find(
  (candidate) => candidate.id === options.case
);
if (!selected) throw new Error(`Unknown case: ${options.case}`);
const before = auditReportSchema.parse(
  JSON.parse(await readFile(resolve(options.before!), "utf8")) as unknown
);
const after = auditReportSchema.parse(
  JSON.parse(await readFile(resolve(options.after!), "utf8")) as unknown
);
const comparison = compareReports(before, after);
const beforeRules = new Set(before.findings.map((finding) => finding.ruleId));
const afterRules = new Set(after.findings.map((finding) => finding.ruleId));
const expectedFound = selected.deterministicRulesExpected.every((rule) =>
  beforeRules.has(rule)
);
const expectedResolved = selected.deterministicRulesExpected.every(
  (rule) => !afterRules.has(rule)
);
const noNewSerious = !comparison.new.some(
  (finding) => finding.impact === "serious" || finding.impact === "critical"
);
const review = options.review
  ? await reviewEvidence(options.review)
  : undefined;
const conservativeFixPassed =
  review !== undefined && review.prohibitedOrMisleadingFixes.length === 0;
let behaviorPassed = selected.behaviorAssertionsExpected.length === 0;
const behaviorEvidence: string[] = [];
if (options["journey-after"]) {
  const afterJourney = journeyReportSchema.parse(
    JSON.parse(
      await readFile(resolve(options["journey-after"]), "utf8")
    ) as unknown
  );
  behaviorPassed = afterJourney.passed;
  behaviorEvidence.push(
    `after journey ${afterJourney.runId}: ${afterJourney.passed ? "passed" : "failed"}`
  );
  if (options["journey-before"]) {
    const beforeJourney = journeyReportSchema.parse(
      JSON.parse(
        await readFile(resolve(options["journey-before"]), "utf8")
      ) as unknown
    );
    behaviorPassed = behaviorPassed && !beforeJourney.passed;
    behaviorEvidence.push(
      `before journey ${beforeJourney.runId}: ${beforeJourney.passed ? "passed" : "failed"}`
    );
  }
}
const checks = [
  {
    id: "expected-deterministic-evidence",
    passed: expectedFound,
    points: expectedFound ? 2 : 0,
    maxPoints: 2,
    evidence: selected.deterministicRulesExpected
  },
  {
    id: "expected-rules-resolved",
    passed: expectedResolved,
    points: expectedResolved ? 3 : 0,
    maxPoints: 3,
    evidence: selected.deterministicRulesExpected
  },
  {
    id: "no-new-serious-or-critical",
    passed: noNewSerious,
    points: noNewSerious ? 2 : 0,
    maxPoints: 2,
    evidence: comparison.new.map(
      (finding) => `${finding.impact}:${finding.ruleId}`
    )
  },
  {
    id: "behavior-replayed",
    passed: behaviorPassed,
    points: behaviorPassed ? 3 : 0,
    maxPoints: 3,
    evidence: behaviorEvidence
  },
  {
    id: "conservative-fix-review",
    passed: conservativeFixPassed,
    points: conservativeFixPassed ? 3 : 0,
    maxPoints: 3,
    evidence: review
      ? review.prohibitedOrMisleadingFixes.length > 0
        ? review.prohibitedOrMisleadingFixes
        : selected.prohibitedFixes.map((fix) => `reviewed: ${fix}`)
      : [
          "No independent review evidence was supplied; prohibited-fix points are withheld."
        ]
  }
];
const rawOutput = options["raw-output"]
  ? relative(process.cwd(), resolve(options["raw-output"]))
  : undefined;
const result = {
  schemaVersion: "1.0.0",
  resultId: randomUUID(),
  timestamp: new Date().toISOString(),
  caseId: selected.id,
  fixtureRevision: catalog.fixtureRevision,
  model: options.model,
  runnerVersion: "0.1.0",
  inputs: {
    beforeRunId: before.runId,
    afterRunId: after.runId,
    ...(rawOutput ? { rawOutput } : {}),
    ...(options.review
      ? { reviewEvidence: relative(process.cwd(), resolve(options.review)) }
      : {})
  },
  checks,
  score: checks.reduce((sum, check) => sum + check.points, 0),
  maxScore: checks.reduce((sum, check) => sum + check.maxPoints, 0),
  publishable: false
};
const output = resolve(
  options.output ?? `evals/results/${selected.id}-${result.resultId}.json`
);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, {
  encoding: "utf8",
  mode: 0o600
});
process.stdout.write(`${output}\n`);
