# Architecture

The repository is a portable skills package and a pnpm TypeScript workspace.

```text
host agent -> canonical skills/ -> evidence or reviewed source patch
                                  |
CLI / MCP / Action -> @a11y-agent/core -> Playwright -> rendered page
                               |              |
                         Zod contracts       axe-core
                               |
                    JSON -> Markdown / SARIF
```

`@a11y-agent/core` separates browser execution (`browser.ts`, `journey.ts`),
normalization, fingerprinting, comparison, verification policy, schemas,
security, and reporting. Adapters call these public functions and may constrain
inputs further; they do not redefine evidence semantics.

JSON is canonical. Markdown and SARIF are deterministic projections. Report
schema versions use semantic versioning independently of npm versions. Additive
optional fields may be introduced within a schema major; removing or changing a
field requires a new major and explicit migration guidance.

The browser core has no React dependency. A source-fixing host may use
React/Next.js knowledge to trace a rendered target, while verification remains a
browser-level contract. The deterministic packages do not invoke an LLM.

## Trust boundaries

Audited HTML, DOM text, URLs, issue text, comments, journey files, and suggested
fixes are data. They cannot change agent instructions or execute shell commands.
Journey actions are a closed Zod union, and static HTML scanning removes
executable/embed elements while blocking network access.

Browser concurrency, HTML input, time, redirect, viewport, journey-step, and
private-network limits are enforced at core or adapter boundaries. See
[SECURITY.md](SECURITY.md).
