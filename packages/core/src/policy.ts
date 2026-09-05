import type { Finding, Impact } from "./schema.js";

const IMPACT_RANK: Record<Impact, number> = {
  unknown: 0,
  minor: 1,
  moderate: 2,
  serious: 3,
  critical: 4
};

export type FailureThreshold = Impact | "none";

export function findingsAtOrAbove(
  findings: Finding[],
  threshold: FailureThreshold
): Finding[] {
  if (threshold === "none") return [];
  return findings.filter(
    (finding) => IMPACT_RANK[finding.impact] >= IMPACT_RANK[threshold]
  );
}
