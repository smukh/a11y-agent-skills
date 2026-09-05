# Public evaluation suite

The suite measures whether an agent reproduces a fixture, interprets
deterministic evidence, changes responsible source conservatively, verifies the
same state, and protects the behavior. It does not publish model rankings in
this initial repository.

`evals/cases/catalog.json` records user impact, standards links, expected
deterministic rules, behavior assertions, manual items, allowed/prohibited
fixes, and regression risks. The paired gallery fixtures expose broken and
repaired states. Negative controls are unusual but valid patterns that must not
be “fixed” with unnecessary ARIA or removed functionality.

`pnpm eval --before <audit.json> --after <audit.json> --case <id> --model <label> --review <review.json>`
writes a schema-valid result. Scores reward expected detection, behavior repair,
no new serious/critical findings, and an independent conservative-fix review.
The review contract withholds points for unnecessary ARIA, hidden content,
fabricated content, scanner suppression, or removed functionality. Omitting the
review cannot produce a full score.

Any future benchmark claim must commit the exact prompts, model/provider
versions, dates, raw agent outputs, deterministic reports, runner version,
fixtures, and rubric. Results from different fixture or prompt revisions are not
directly comparable.

## Add a case

Add one catalog entry and paired `data-case` sections or dedicated fixture
pages. State the expected engine rules separately from behavioral/manual
assertions. Add a negative control when an overly broad repair is plausible. Run
the broken state twice to check fingerprint stability, then verify the repaired
state and the scorer.
