# a11y-agent-skills

<p>
  <a href="https://github.com/smukh/a11y-agent-skills/tree/main/skills"><img alt="Skills: 7" src="https://img.shields.io/badge/skills-7-1f6feb"></a>
  <a href="https://agentskills.io/specification"><img alt="Format: Agent Skills" src="https://img.shields.io/badge/format-Agent%20Skills-6f42c1"></a>
  <a href="https://www.npmjs.com/package/@a11y-agent/core"><img alt="npm version" src="https://img.shields.io/npm/v/@a11y-agent/core?label=npm"></a>
  <a href="https://github.com/smukh/a11y-agent-skills/blob/main/LICENSE"><img alt="License: MIT" src="https://img.shields.io/github/license/smukh/a11y-agent-skills"></a>
  <a href="https://github.com/smukh/a11y-agent-skills/actions/workflows/ci.yml"><img alt="CI status" src="https://img.shields.io/github/actions/workflow/status/smukh/a11y-agent-skills/ci.yml?branch=main&amp;label=CI"></a>
  <a href="https://github.com/smukh/a11y-agent-skills/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/smukh/a11y-agent-skills?style=flat&amp;logo=github"></a>
</p>

<p>
  <a href="https://webafterai.substack.com/"><img alt="Subscribe to Web After AI" src="https://img.shields.io/badge/Subscribe-Web%20After%20AI-f65a23?logo=substack&amp;logoColor=white"></a>
</p>

> Find the regression, fix the source, prove the repair.

![Diagram showing the a11y-agent-skills audit, repair, verification, and regression-test workflow](https://github.com/user-attachments/assets/c0d9a68b-63de-49e8-9c4a-84775dc57d2d)

An open-source accessibility quality layer for teams building interfaces with
AI. Twelve portable Agent Skills guide coding agents through reproducible
evidence, conservative source fixes, scoped verification, and durable regression
tests. Framework-independent Playwright and axe-core packages provide the
deterministic core; React is the first tested framework fixture.

## One complete workflow

Published core, CLI, and MCP packages support Node.js 20+. Run the CLI without
cloning the repository:

```bash
npx --yes playwright@1.58.0 install chromium
npx --yes @a11y-agent/cli doctor
npx --yes @a11y-agent/cli scan https://example.com
```

To keep the command available locally, use
`npm install --global @a11y-agent/cli` and run `a11y-agent doctor`.

For an MCP host, launch the stdio server with:

```bash
npx --yes @a11y-agent/mcp
```

Building from source requires Node.js 22.13+ and pnpm 11.19. From a clone:

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

The canonical skills are the twelve directories under `skills/`; hosts should
use them directly.

From a local clone, install all twelve for Codex without prompts:

```bash
npx skills@1.5.9 add . --agent codex --yes
```

Install directly from GitHub:

```bash
npx skills@1.5.9 add smukh/a11y-agent-skills --agent codex --yes
```

- **Codex:** install the repository as a plugin, or copy `skills/*` into
  `~/.agents/skills/`.
- **Claude Code:** run `/plugin marketplace add smukh/a11y-agent-skills`, then
  `/plugin install a11y-agent-skills@a11y-agent-skills`. You can also copy the
  folders into `.claude/skills/`.
- **Cursor:** use `npx skills@1.5.9 add smukh/a11y-agent-skills` and select
  Cursor, or copy the folders into `.cursor/skills/`.
- **Generic Agent Skills hosts:** point the host at `skills/`, following the
  [Agent Skills specification](https://agentskills.io/specification).

All supported hosts use the same canonical skill files.

## Specialist skills in 0.2.0

The second release adds five specialist workflows to the original seven skills.
All twelve remain portable and use the canonical `skills/` tree.

| Skill                                                                                        | Use it for                                                                |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [accessible-authentication](skills/accessible-authentication/SKILL.md)                       | Login, MFA, OTP paste, recovery, and reauthentication                     |
| [accessible-data-tables-and-grids](skills/accessible-data-tables-and-grids/SKILL.md)         | Table/grid decisions, editing, sorting, focus, and virtualization review  |
| [accessible-dynamic-updates](skills/accessible-dynamic-updates/SKILL.md)                     | Status, SPA transitions, streaming, cancellation, and announcement review |
| [accessible-combobox-and-autocomplete](skills/accessible-combobox-and-autocomplete/SKILL.md) | Suggestion popups, keyboard selection, and stale async responses          |
| [accessible-charts-and-dashboards](skills/accessible-charts-and-dashboards/SKILL.md)         | Data alternatives, filtering, chart interpretation, and equivalent tasks  |

For example: “Use accessible-combobox-and-autocomplete to review this city
selector, reproduce an out-of-order response, and protect the selected value
with a regression test.”

Each specialist includes a focused reference guide, standards links, manual
assistive-technology procedures, and paired behavioral fixtures. See the
[specialist evaluation guide](docs/SPECIALIST-EVALUATION.md) for runnable tests,
agent prompts, coverage limits, and negative controls. Browser assertions do not
prove screen-reader speech or task usability with every AT combination. See
[release notes](docs/releases/0.2.0.md) for version and packaging details.

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
- [Contributing](CONTRIBUTING.md) and
  [third-party notices](THIRD_PARTY_NOTICES.md)

## Support boundary

Chromium, Firefox, and WebKit are exposed by core through Playwright; CI
exercises Chromium. The browser layer is framework-independent. Source-location
guidance currently targets React conventions, but packages do not require a
framework. The repository is local-first, has no telemetry, needs no LLM or API
key, and does not auto-edit source or open pull requests.
