# a11y-agent-skills

> Find the regression, fix the source, prove the repair.

An open-source accessibility quality layer for teams building interfaces with
AI. Seven portable Agent Skills guide coding agents through reproducible
evidence, conservative source fixes, scoped verification, and durable regression
tests. Framework-independent Playwright and axe-core packages provide the
deterministic core; React is the first tested framework fixture.

## One complete workflow

Building from source requires Node.js 22.13+ and pnpm 11.19. Published core,
CLI, and MCP packages support Node.js 20+. From a clone:

```bash
pnpm install
pnpm exec playwright install chromium
pnpm build
pnpm fixtures:serve
```

The fixture server prints its local URL. In another terminal, ask your coding
agent:

> Use accessibility-audit to audit the checkout state at
> http://127.0.0.1:4173/gallery-broken.html. Save JSON evidence to
> .a11y-agent/checkout-before.json.

The equivalent deterministic command is:

```bash
pnpm exec a11y-agent scan http://127.0.0.1:4173/gallery-broken.html \
  --state checkout-invalid --route /checkout --output .a11y-agent/checkout-before.json
```

Review a fingerprint and its bounded DOM evidence, then ask:

> Use fix-accessibility-issue to locate the source of this finding, make the
> smallest supported repair, replay checkout-invalid, verify the fingerprint is
> gone, and add the narrowest regression test.

The agent should run:

```bash
pnpm exec a11y-agent verify http://127.0.0.1:4173/gallery-repaired.html \
  --state checkout-invalid --route /checkout --baseline .a11y-agent/checkout-before.json \
  --ready-selector '#main' \
  --output .a11y-agent/checkout-verification.json
```

The verification report records state reproduction, resolved and remaining
fingerprints, new serious/critical findings, and exact run IDs. The regression
test protects behavior such as an error being programmatically exposed—not
merely the presence of one attribute.

## Install the skills

The canonical skills are the seven directories under `skills/`; hosts should use
them directly.

From a local clone, install all seven for Codex without prompts:

```bash
npx skills@1.5.9 add . --agent codex --yes
```

After publication, install directly from GitHub:

```bash
npx skills@1.5.9 add smukh/a11y-agent-skills --agent codex --yes
```

The local form is covered by release acceptance. The remote shorthand must be
checked once against the private GitHub repository before public launch.

- **Codex:** install the repository as a plugin, or copy `skills/*` into
  `~/.agents/skills/`.
- **Claude Code:** add the repository as a marketplace and install
  `a11y-agent-skills`, or copy the folders into `.claude/skills/`.
- **Cursor:** use `npx skills@1.5.9 add smukh/a11y-agent-skills` after
  publication and select Cursor, or copy the folders into `.cursor/skills/`.
- **Generic Agent Skills hosts:** point the host at `skills/`, following the
  [Agent Skills specification](https://agentskills.io/specification).

No host-specific copy of a skill is maintained. `.codex-plugin` and
`.claude-plugin` metadata point to the same source tree.

## CLI

```text
a11y-agent scan <url>
a11y-agent scan-html <file>
a11y-agent compare <before.json> <after.json>
a11y-agent verify <url> --baseline <report.json>
a11y-agent keyboard <url> --journey <journey.json>
a11y-agent doctor
```

Every evidence command supports JSON, Markdown, and SARIF. Scans support
explicit output, state, viewport, axe tags, include/exclude selectors,
Playwright storage state, request headers, failure thresholds, baselines,
readiness selectors, and reduced-motion emulation. Authentication inputs are not
serialized, and credential-shaped output is redacted. Reports still contain
bounded page evidence and must be handled as potentially sensitive artifacts.
Loopback URLs are treated as an explicit local target; other private networks
require `--allow-private-network`.

## What this can determine

The tools can scan route-addressable states, wait for an observable readiness
selector, preserve deterministic engine findings, stabilize their fingerprints,
compare compatible runs, execute bounded keyboard journeys, and verify a defined
repair. They distinguish automated detection from heuristic inference and
required human review.

They cannot certify WCAG, decide whether content meaning is correct, replace
disabled participants, or represent every browser and assistive-technology
combination. axe-core is used because its maintained rule engine, metadata,
tests, and ecosystem should not be reimplemented here. The project preserves
axe-provided mappings and provenance without inventing standards relationships.

> Automated and agent-assisted testing identifies a subset of accessibility
> barriers. This result is not a declaration of WCAG conformance.

## Packages

| Package                     | Responsibility                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| `@a11y-agent/core`          | Browser execution, schemas, normalization, fingerprints, comparison, verification, journeys, reporters |
| `@a11y-agent/cli`           | Local command-line adapter                                                                             |
| `@a11y-agent/mcp`           | Bounded MCP adapter with private-network denial by default                                             |
| `@a11y-agent/github-action` | Explicit-threshold CI adapter that uploads JSON and SARIF                                              |

Reports default to stdout. Project artifacts should live in `.a11y-agent/`,
which is ignored unless a team deliberately force-adds a reviewed baseline.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Evidence model](docs/EVIDENCE-MODEL.md)
- [Manual review](docs/MANUAL-REVIEW.md)
- [Security and privacy](docs/SECURITY.md)
- [Standards boundary](docs/STANDARDS.md)
- [Public evaluations](docs/EVALUATION.md)
- [Competitive landscape](docs/COMPETITIVE-LANDSCAPE.md)
- [Contributing](CONTRIBUTING.md) and
  [third-party notices](THIRD_PARTY_NOTICES.md)

## Support boundary

Chromium, Firefox, and WebKit are exposed by core through Playwright; CI
exercises Chromium. The browser layer is framework-independent. Source-location
guidance currently targets React conventions, but packages do not require a
framework. The repository is local-first, has no telemetry, needs no LLM or API
key, and does not auto-edit source or open pull requests.
