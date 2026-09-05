# Audit-only evaluation prompt template

Reproduce `{caseId}` at `{brokenUrl}`. Run deterministic browser checks first,
preserve engine metadata and provenance, and separate automatically detected
findings from heuristic observations and manual-review requirements. Do not
change source and do not describe a clean scan as WCAG conformance. Return the
exact state, evidence, commands, and limitations.
