# Evidence model

Schema `1.0.0` is defined in `packages/core/src/schema.ts` and checked at every
adapter boundary.

Every audit, comparison, verification, and journey report carries a provenance
envelope: requested and final URL, normalized route, state label, page title,
viewport, browser and engine versions, configured axe tags, selector scope,
authentication mode, findings, manual review, execution/partial-result reasons,
and completeness. It records no authentication values. Comparison reports use
the current scan's scope and retain both source run IDs; verification reports
also embed the exact after-scan evidence when reproduction succeeds.

Each finding contains an axe rule ID and source, impact, axe-supplied WCAG tag
mappings with source, all engine tags, description, raw and normalized target,
bounded/redacted HTML, failure summary, help URL, state label, detection method,
lifecycle, and fingerprint.

Fingerprints hash normalized route, normalized state label, rule ID, and
normalized target path. Only query keys and element IDs that match conservative
generated-value patterns are removed. Run IDs, timestamps, raw browser versions,
and changing page content are not fingerprint inputs.

Comparison preserves unresolved baseline findings as `unchanged`, not
suppressed. A stable location whose evidence changed is `changedOrUncertain`; a
single same-rule finding that moved within a state is also uncertain rather than
guessed resolved/new.

A repair is `verified` only if the baseline was complete, the same origin and
route/state scope is scanned, every selected fingerprint belongs to the baseline
and is absent, no selected finding moved or changed uncertainly, and no new
serious or critical finding occurs. A non-default state also requires a visible
`readySelector` as an observable witness. Navigation, readiness, or scope
failure returns `unverified`; the tool does not infer state from a
caller-provided label.

Every report states:

> Automated and agent-assisted testing identifies a subset of accessibility
> barriers. This result is not a declaration of WCAG conformance.
