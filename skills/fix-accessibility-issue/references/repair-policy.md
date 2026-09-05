# Conservative repair policy

Prefer, in order: correct native element and document structure; native
attributes and associations; small interaction or focus-management changes; ARIA
only when native semantics cannot express the required widget.

Reject repairs that hide visible content from assistive technology, remove
working functionality, add redundant roles, fabricate content, weaken tests,
suppress a rule without evidence, or broadly rewrite a component for a local
defect. For custom widgets, verify name, role, value, keyboard model, focus, and
announcements as one behavior—not as independent attributes.
