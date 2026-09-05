import axe from "axe-core";
import { randomUUID } from "node:crypto";
import {
  DEFAULT_WCAG_TAGS,
  MAX_HTML_EVIDENCE_LENGTH,
  NON_CONFORMANCE_DISCLAIMER,
  SCHEMA_VERSION
} from "./constants.js";
import {
  createFindingFingerprint,
  normalizeRoute,
  normalizeTargetPath
} from "./fingerprint.js";
import type { AuditReport, Finding } from "./schema.js";
import { auditReportSchema } from "./schema.js";
import { redactHtmlEvidence, redactSecrets } from "./security.js";

export interface NormalizeAxeOptions {
  results: axe.AxeResults;
  requestedUrl: string;
  finalUrl: string;
  routeLabel?: string | undefined;
  stateLabel: string;
  title: string;
  viewport: { width: number; height: number };
  browser: { name: string; version: string };
  wcagTags?: string[] | undefined;
  include?: string[] | undefined;
  exclude?: string[] | undefined;
  authenticationMode: AuditReport["authenticationMode"];
  errors?: AuditReport["executionErrors"] | undefined;
  partialReasons?: string[] | undefined;
  sensitiveValues?: string[] | undefined;
}

function boundedEvidence(value: string, sensitiveValues: string[]): string {
  const redacted = redactHtmlEvidence(
    value.replace(/\s+/g, " ").trim(),
    sensitiveValues
  );
  return redacted.length <= MAX_HTML_EVIDENCE_LENGTH
    ? redacted
    : `${redacted.slice(0, MAX_HTML_EVIDENCE_LENGTH - 1)}…`;
}

function findingFromNode(
  violation: axe.Result,
  node: axe.NodeResult,
  route: string,
  stateLabel: string,
  sensitiveValues: string[]
): Finding {
  const target = node.target.map(String).join(" >> ");
  const normalizedTarget = normalizeTargetPath(target);
  return {
    fingerprint: createFindingFingerprint({
      route,
      stateLabel,
      ruleId: violation.id,
      target
    }),
    ruleId: violation.id,
    ruleSource: "axe-core",
    impact: violation.impact ?? "unknown",
    wcagMappings: violation.tags
      .filter((tag) => /^wcag\d/i.test(tag))
      .map((id) => ({ id, source: "axe-core" })),
    ruleTags: [...violation.tags],
    description: violation.description,
    target,
    normalizedTarget,
    htmlEvidence: boundedEvidence(node.html, sensitiveValues),
    failureSummary: redactSecrets(
      node.failureSummary ?? "No failure summary was supplied by axe-core.",
      sensitiveValues
    ),
    helpUrl: violation.helpUrl,
    pageLabel: stateLabel,
    detectedBy: "automated",
    lifecycle: "remaining"
  };
}

export function normalizeAxeResults(options: NormalizeAxeOptions): AuditReport {
  const route = options.routeLabel ?? normalizeRoute(options.finalUrl);
  const sensitiveValues = options.sensitiveValues ?? [];
  const findings = options.results.violations
    .flatMap((violation) =>
      violation.nodes.map((node) =>
        findingFromNode(
          violation,
          node,
          route,
          options.stateLabel,
          sensitiveValues
        )
      )
    )
    .sort((a, b) => a.fingerprint.localeCompare(b.fingerprint));
  const errors = options.errors ?? [];
  const partialReasons = options.partialReasons ?? [];
  return auditReportSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    reportType: "audit",
    runId: randomUUID(),
    timestamp: new Date().toISOString(),
    requestedUrl: redactSecrets(options.requestedUrl, sensitiveValues),
    finalUrl: redactSecrets(options.finalUrl, sensitiveValues),
    route,
    stateLabel: options.stateLabel,
    pageTitle: redactSecrets(options.title, sensitiveValues),
    viewport: options.viewport,
    browser: options.browser,
    engine: { name: "axe-core", version: axe.version },
    configuredWcagTags: options.wcagTags ?? DEFAULT_WCAG_TAGS,
    selectors: {
      include: options.include ?? [],
      exclude: options.exclude ?? []
    },
    authenticationMode: options.authenticationMode,
    findings,
    manualReview: [
      {
        id: "meaning-and-alternatives",
        description:
          "Review whether labels, names, alternatives, and instructions convey the intended meaning.",
        reason:
          "The deterministic engine can detect some missing markup but cannot determine product meaning.",
        status: "required"
      },
      {
        id: "keyboard-and-focus",
        description:
          "Complete the relevant task with a keyboard and assess focus visibility and order.",
        reason:
          "Static rule evaluation does not establish usable interaction behavior.",
        status: "required"
      },
      {
        id: "assistive-technology",
        description:
          "Test representative tasks with real assistive technologies and disabled users where practical.",
        reason:
          "Browser automation is not equivalent to lived user or assistive-technology evidence.",
        status: "required"
      }
    ],
    executionErrors: errors,
    partialResultReasons: partialReasons,
    complete: errors.length === 0 && partialReasons.length === 0,
    disclaimer: NON_CONFORMANCE_DISCLAIMER
  });
}
