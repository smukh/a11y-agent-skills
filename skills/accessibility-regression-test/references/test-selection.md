# Test-layer selection

- Use a lint rule for a static JSX misuse that can be decided from source alone.
- Use a component test with an accessibility engine when rendering the isolated
  component faithfully reproduces the issue.
- Use a Playwright assertion for browser semantics, computed styles, routing, or
  DOM integration.
- Use a keyboard journey for focus order, containment, restoration, and
  established key behavior.
- Use a manual-review record when meaning, usability, assistive-technology
  support, or subjective quality determines success.

Prefer one focused behavior assertion plus a scoped axe regression over a broad
page snapshot.
