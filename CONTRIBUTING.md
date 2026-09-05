# Contributing

Use Node.js 22.13+ and pnpm 11.19. Install with `pnpm install`, install Chromium
with `pnpm exec playwright install chromium`, and run `pnpm run ci` before
requesting review.

## Add or change a skill

Keep the folder name and frontmatter `name` identical. Frontmatter may use only
Agent Skills fields; include quoted `metadata.version`. Make trigger
descriptions specific, keep `SKILL.md` under 500 lines, and link focused
references one level deep. Put tests outside `skills/`. A skill that adds
`scripts/` must add `tests/skills/<name>/`. Run `pnpm validate:skills`.

## Add a fixture or evaluation

Follow [docs/EVALUATION.md](docs/EVALUATION.md). Include broken and repaired
behavior, user impact, standards references, deterministic and manual
expectations, allowed/prohibited fixes, and regression risks. Avoid invented
content meaning and include a negative control for likely over-fixing.

## Packages and releases

Core owns behavior and contracts; keep adapters thin. Add tests for public API
changes and preserve schema compatibility within a major version. Add a
Changeset for publishable changes. Do not update one package or host manifest
version alone—contracts require synchronization.

All contributions are MIT-licensed. Do not copy incompatible source, GPL text,
standards prose, or assets. Add borrowed compatible excerpts or derived assets
to `THIRD_PARTY_NOTICES.md` with exact provenance.
