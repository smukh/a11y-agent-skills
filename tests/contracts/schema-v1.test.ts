import { describe, expect, it } from "vitest";
import {
  auditReportSchema,
  compareReports,
  comparisonReportSchema,
  journeyReportSchema,
  verificationReportSchema
} from "../../packages/core/src/index.js";
import { makeFinding, makeReport } from "../helpers/report.js";

describe("schema major 1 compatibility", () => {
  it("accepts the committed minimum audit shape and rejects unknown fields", () => {
    const report = makeReport([makeFinding()]);
    expect(auditReportSchema.parse(report).schemaVersion).toBe("1.0.0");
    expect(() =>
      auditReportSchema.parse({ ...report, accidentalBreakingField: true })
    ).toThrow();
  });

  it("exports every public report schema", () => {
    expect(comparisonReportSchema).toBeDefined();
    expect(verificationReportSchema).toBeDefined();
    expect(journeyReportSchema).toBeDefined();
  });

  it("keeps comparison reports self-describing", () => {
    const report = compareReports(makeReport([makeFinding()]), makeReport([]));
    for (const key of [
      "runId",
      "timestamp",
      "requestedUrl",
      "finalUrl",
      "route",
      "stateLabel",
      "pageTitle",
      "viewport",
      "browser",
      "engine",
      "configuredWcagTags",
      "selectors",
      "authenticationMode",
      "findings",
      "manualReview",
      "executionErrors",
      "partialResultReasons",
      "complete"
    ]) {
      expect(report).toHaveProperty(key);
    }
  });
});
