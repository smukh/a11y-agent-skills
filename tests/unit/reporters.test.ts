import { describe, expect, it } from "vitest";
import {
  formatJson,
  formatMarkdown,
  formatSarif
} from "../../packages/core/src/index.js";
import { makeFinding, makeReport } from "../helpers/report.js";

describe("reporters", () => {
  it("emits valid JSON, readable Markdown, and SARIF 2.1.0", () => {
    const report = makeReport([makeFinding()]);
    expect(JSON.parse(formatJson(report))).toMatchObject({
      reportType: "audit"
    });
    expect(formatMarkdown(report)).toContain("## Findings");
    const sarif = JSON.parse(formatSarif(report)) as {
      version: string;
      runs: unknown[];
    };
    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs).toHaveLength(1);
  });

  it("does not expose secrets present in an input field", () => {
    const report = makeReport([], {
      pageTitle: "Authorization: Bearer super-secret"
    });
    expect(formatJson(report)).not.toContain("super-secret");
    expect(formatMarkdown(report)).not.toContain("super-secret");
  });
});
