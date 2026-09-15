# Specialist evaluation guide

The 0.2.0 collection adds five specialist case families in
[the case catalog](../evals/cases/catalog.json), paired pages under
`fixtures/static/specialists/`, and
[agent task prompts](../evals/prompts/specialists.json). The fixture revision is
`gallery-2`; existing gallery cases are retained.

## Run the deterministic fixture checks

After the README source setup:

```sh
pnpm exec vitest run tests/browser/specialists.test.ts
pnpm fixtures:serve
```

Open the relevant `/specialists/<name>-broken.html` and
`/specialists/<name>-repaired.html` paths on the printed local server origin.
These pages use synthetic data; they do not call real authentication or sales
services. The autocomplete fixture fetches a local JSON file; the browser test
controls the response order explicitly.

| Family         | Broken/repaired distinction                                            | Additional checks                                                    |
| -------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| authentication | Real clipboard paste loses digits / fills the whole code               | Leading zero, invalid input, expiry, resend                          |
| grid           | Save/reorder moves focus to another record / retains the edited record | Arrow navigation, edit cancellation, native editing keys, Tab exit   |
| dynamic        | Stream has assertive live exposure / separate polite status            | Content retained, focus, cancellation, failure, retry                |
| combobox       | Obsolete response replaces current suggestions / is ignored            | Active option, selected value, no results, failure, retry, dismissal |
| charts         | Filter updates chart only / updates chart and table                    | Zero values, empty results, reset, control focus                     |

The tests assert the known failure in the broken fixture and the expected
behavior in the repaired fixture. A passing test suite therefore means it can
distinguish those variants; it does not mean the broken pages are accessible.
Initial repaired states and native negative controls are also checked with axe.
No axe rule is promised for the five temporal/data defects: empty
`deterministicRulesExpected` arrays are intentional. Repeat scoped scans when
using the evaluation runner to retain stable engine evidence; behavior remains
separate evidence even if both scans are clean.

## Run an agent evaluation

Give the agent the named skill, the relevant prompt, the local broken URL, and
only the source needed for that fixture. The broken/repaired pages share a
script with an explicit fixture-variant branch for maintainable demonstrations.
For a blind evaluation, prepare an isolated working copy containing only the
broken behavior, remove the repaired branch and reference page, and keep
expected results/test oracles with the reviewer. Otherwise the result measures
access to the supplied repair as well as the skill. Do not present that as blind
performance.

Record exact model/provider/version, date, skill revision, fixture revision,
prompt, environment, raw agent output, source diff, tests, and before/after
reports. Use the negative-control prompt separately to check over-fixing.
Preserve the agent's actual results; do not fill in missing AT evidence.

Assess reproduction, task completion, preserved functionality, conservative
repair, regression quality, and explicit manual-review boundaries using the
catalog's allowed/prohibited fixes and behavior expectations. Treat suppressing
a scanner, hiding information, inventing data, or removing the feature as a
failed repair even when scan counts improve.

The existing `pnpm eval` scorer accepts bounded keyboard-journey evidence. Its
current schema cannot represent clipboard, network-response order, chart-data
comparison, or live-region mutation assertions. Do not feed it an unrelated
passing journey to obtain behavior points. For these specialist cases, retain
the browser-test output and manual review alongside the result; behavior points
remain withheld without supported evidence. There is no new model benchmark or
published performance score in this release.

## Manual assistive-technology review

Each specialist reference includes a task-specific procedure. Record OS, browser
and AT versions, date, task state, expected behavior, actual speech/focus, and
pass/fail/pending. Screen-reader speech, password-manager compatibility,
mobile/IME behavior, meaning of chart summaries, and practical usability require
those additional checks. Tests here execute Chromium browser behavior only.

The guides discuss virtualization, external authentication, SPA routing and
other real-world variants beyond the small fixtures. Those are review guidance,
not claims that this release tests every variant. Scope any completion statement
to the actual fixture and environment that ran.
