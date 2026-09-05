export const SCHEMA_VERSION = "1.0.0" as const;

export const NON_CONFORMANCE_DISCLAIMER =
  "Automated and agent-assisted testing identifies a subset of accessibility barriers. This result is not a declaration of WCAG conformance." as const;

export const DEFAULT_WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa"
];
export const DEFAULT_VIEWPORT = { width: 1280, height: 720 } as const;
export const DEFAULT_TIMEOUT_MS = 30_000;
export const MAX_HTML_EVIDENCE_LENGTH = 800;
export const MAX_REDIRECTS = 10;
export const MAX_HTML_INPUT_BYTES = 1_000_000;
export const MAX_LIVE_DOCUMENT_BYTES = 10_000_000;
