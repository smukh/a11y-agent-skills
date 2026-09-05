import { z } from "zod";
import { NON_CONFORMANCE_DISCLAIMER, SCHEMA_VERSION } from "./constants.js";

export const viewportSchema = z
  .object({
    width: z.number().int().min(200).max(7680),
    height: z.number().int().min(200).max(4320)
  })
  .strict();

export const impactSchema = z.enum([
  "minor",
  "moderate",
  "serious",
  "critical",
  "unknown"
]);
export const lifecycleSchema = z.enum([
  "new",
  "unchanged",
  "resolved",
  "remaining",
  "unverified"
]);
export const detectionSchema = z.enum([
  "automated",
  "heuristic",
  "manual-review"
]);

export const findingSchema = z
  .object({
    fingerprint: z.string().regex(/^[a-f0-9]{32}$/),
    ruleId: z.string().min(1),
    ruleSource: z.string().min(1),
    impact: impactSchema,
    wcagMappings: z.array(
      z.object({ id: z.string().min(1), source: z.string().min(1) }).strict()
    ),
    ruleTags: z.array(z.string()),
    description: z.string(),
    target: z.string().min(1),
    normalizedTarget: z.string().min(1),
    htmlEvidence: z.string(),
    failureSummary: z.string(),
    helpUrl: z.string().url(),
    pageLabel: z.string().min(1),
    detectedBy: detectionSchema,
    lifecycle: lifecycleSchema
  })
  .strict();

export const manualReviewSchema = z
  .object({
    id: z.string().min(1),
    description: z.string().min(1),
    reason: z.string().min(1),
    status: z.enum(["required", "completed", "not-applicable"])
  })
  .strict();

export const executionErrorSchema = z
  .object({
    stage: z.enum([
      "security",
      "navigation",
      "state",
      "scan",
      "journey",
      "report"
    ]),
    message: z.string().min(1),
    recoverable: z.boolean()
  })
  .strict();

export const auditReportSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    reportType: z.literal("audit"),
    runId: z.string().uuid(),
    timestamp: z.string().datetime(),
    requestedUrl: z.string().min(1),
    finalUrl: z.string().min(1),
    route: z.string().min(1),
    stateLabel: z.string().min(1),
    pageTitle: z.string(),
    viewport: viewportSchema,
    browser: z
      .object({ name: z.string().min(1), version: z.string().min(1) })
      .strict(),
    engine: z
      .object({ name: z.string().min(1), version: z.string().min(1) })
      .strict(),
    configuredWcagTags: z.array(z.string()),
    selectors: z
      .object({ include: z.array(z.string()), exclude: z.array(z.string()) })
      .strict(),
    authenticationMode: z.enum([
      "none",
      "headers",
      "storage-state",
      "headers-and-storage-state"
    ]),
    findings: z.array(findingSchema),
    manualReview: z.array(manualReviewSchema),
    executionErrors: z.array(executionErrorSchema),
    partialResultReasons: z.array(z.string()),
    complete: z.boolean(),
    disclaimer: z.literal(NON_CONFORMANCE_DISCLAIMER)
  })
  .strict();

export const changedFindingSchema = z
  .object({
    before: findingSchema,
    after: findingSchema,
    reason: z.string().min(1)
  })
  .strict();

export const comparisonReportSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    reportType: z.literal("comparison"),
    runId: z.string().uuid(),
    timestamp: z.string().datetime(),
    requestedUrl: z.string().min(1),
    finalUrl: z.string().min(1),
    route: z.string().min(1),
    stateLabel: z.string().min(1),
    pageTitle: z.string(),
    viewport: viewportSchema,
    browser: z
      .object({ name: z.string().min(1), version: z.string().min(1) })
      .strict(),
    engine: z
      .object({ name: z.string().min(1), version: z.string().min(1) })
      .strict(),
    configuredWcagTags: z.array(z.string()),
    selectors: z
      .object({ include: z.array(z.string()), exclude: z.array(z.string()) })
      .strict(),
    authenticationMode: z.enum([
      "none",
      "headers",
      "storage-state",
      "headers-and-storage-state"
    ]),
    findings: z.array(findingSchema),
    manualReview: z.array(manualReviewSchema),
    executionErrors: z.array(executionErrorSchema),
    partialResultReasons: z.array(z.string()),
    complete: z.boolean(),
    beforeRunId: z.string().uuid(),
    afterRunId: z.string().uuid(),
    new: z.array(findingSchema),
    resolved: z.array(findingSchema),
    unchanged: z.array(findingSchema),
    changedOrUncertain: z.array(changedFindingSchema),
    counts: z
      .object({
        new: z.number().int(),
        resolved: z.number().int(),
        unchanged: z.number().int(),
        changedOrUncertain: z.number().int()
      })
      .strict(),
    disclaimer: z.literal(NON_CONFORMANCE_DISCLAIMER)
  })
  .strict();

export const verificationReportSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    reportType: z.literal("verification"),
    runId: z.string().uuid(),
    timestamp: z.string().datetime(),
    requestedUrl: z.string().min(1),
    finalUrl: z.string().min(1),
    route: z.string().min(1),
    stateLabel: z.string().min(1),
    pageTitle: z.string(),
    viewport: viewportSchema,
    browser: z
      .object({ name: z.string().min(1), version: z.string().min(1) })
      .strict(),
    engine: z
      .object({ name: z.string().min(1), version: z.string().min(1) })
      .strict(),
    configuredWcagTags: z.array(z.string()),
    selectors: z
      .object({ include: z.array(z.string()), exclude: z.array(z.string()) })
      .strict(),
    authenticationMode: z.enum([
      "none",
      "headers",
      "storage-state",
      "headers-and-storage-state"
    ]),
    findings: z.array(findingSchema),
    manualReview: z.array(manualReviewSchema),
    executionErrors: z.array(executionErrorSchema),
    partialResultReasons: z.array(z.string()),
    complete: z.boolean(),
    status: z.enum(["verified", "unverified"]),
    stateReproduced: z.boolean(),
    originalFingerprints: z.array(z.string()),
    absentFingerprints: z.array(z.string()),
    remainingFingerprints: z.array(z.string()),
    newSeriousOrCritical: z.array(findingSchema),
    evidence: z
      .object({
        baselineRunId: z.string().uuid(),
        afterRunId: z.string().uuid().optional(),
        route: z.string(),
        stateLabel: z.string()
      })
      .strict(),
    reasons: z.array(z.string()),
    comparison: comparisonReportSchema.optional(),
    after: auditReportSchema.optional(),
    disclaimer: z.literal(NON_CONFORMANCE_DISCLAIMER)
  })
  .strict();

const targetSchema = z.union([
  z.object({ selector: z.string().min(1) }).strict(),
  z
    .object({ role: z.string().min(1), name: z.string().min(1).optional() })
    .strict()
]);

const keySchema = z.enum([
  "Tab",
  "Shift+Tab",
  "Enter",
  "Space",
  "Escape",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight"
]);

export const journeyActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("navigate"), url: z.string().url() }).strict(),
  z.object({ type: z.literal("click"), target: targetSchema }).strict(),
  z.object({ type: z.literal("press"), key: keySchema }).strict(),
  z
    .object({
      type: z.literal("fill"),
      target: targetSchema,
      value: z.string().max(10_000)
    })
    .strict(),
  z
    .object({
      type: z.literal("waitFor"),
      selector: z.string().min(1),
      timeoutMs: z.number().int().min(1).max(30_000).optional()
    })
    .strict(),
  z.object({ type: z.literal("assertFocus"), target: targetSchema }).strict(),
  z
    .object({
      type: z.literal("assertAccessibleName"),
      target: targetSchema,
      name: z.string()
    })
    .strict(),
  z
    .object({
      type: z.literal("assertVisible"),
      target: targetSchema,
      visible: z.boolean().default(true)
    })
    .strict(),
  z
    .object({
      type: z.literal("assertFocusWithin"),
      selector: z.string().min(1)
    })
    .strict(),
  z
    .object({ type: z.literal("assertFocusReturned"), target: targetSchema })
    .strict()
]);

export const keyboardJourneySchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    name: z.string().min(1).max(120),
    stateLabel: z.string().min(1).default("default"),
    actions: z.array(journeyActionSchema).min(1).max(200)
  })
  .strict();

export const journeyStepResultSchema = z
  .object({
    index: z.number().int().nonnegative(),
    action: journeyActionSchema,
    status: z.enum(["passed", "failed", "skipped"]),
    focusedElement: z.string(),
    accessibleName: z.string(),
    failureReason: z.string().optional(),
    durationMs: z.number().nonnegative()
  })
  .strict();

export const journeyReportSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    reportType: z.literal("keyboard-journey"),
    runId: z.string().uuid(),
    timestamp: z.string().datetime(),
    journeyName: z.string(),
    requestedUrl: z.string(),
    finalUrl: z.string(),
    route: z.string(),
    stateLabel: z.string(),
    pageTitle: z.string(),
    viewport: viewportSchema,
    browser: z.object({ name: z.string(), version: z.string() }).strict(),
    engine: z
      .object({ name: z.string().min(1), version: z.string().min(1) })
      .strict(),
    configuredWcagTags: z.array(z.string()),
    selectors: z
      .object({ include: z.array(z.string()), exclude: z.array(z.string()) })
      .strict(),
    authenticationMode: z.enum([
      "none",
      "headers",
      "storage-state",
      "headers-and-storage-state"
    ]),
    findings: z.array(findingSchema),
    steps: z.array(journeyStepResultSchema),
    passed: z.boolean(),
    executionErrors: z.array(executionErrorSchema),
    partialResultReasons: z.array(z.string()),
    complete: z.boolean(),
    manualReview: z.array(manualReviewSchema),
    disclaimer: z.literal(NON_CONFORMANCE_DISCLAIMER)
  })
  .strict();

export type AuditReport = z.infer<typeof auditReportSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type ComparisonReport = z.infer<typeof comparisonReportSchema>;
export type VerificationReport = z.infer<typeof verificationReportSchema>;
export type KeyboardJourney = z.infer<typeof keyboardJourneySchema>;
export type JourneyAction = z.infer<typeof journeyActionSchema>;
export type JourneyReport = z.infer<typeof journeyReportSchema>;
export type Impact = z.infer<typeof impactSchema>;
