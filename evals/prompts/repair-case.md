# Evaluation prompt template

Use the repository's accessibility skills to reproduce `{caseId}` at
`{brokenUrl}`. Collect deterministic evidence, identify what still requires
human judgment, locate the responsible authored source, and make the smallest
supported repair. Do not invent content meaning, add unnecessary ARIA, hide
content, remove functionality, or suppress a rule. Replay the same state at
`{repairedUrl}`, verify that the original evidence is gone without new serious
or critical failures, and add the narrowest user-behavior regression test.
Return the patch, raw reports, commands, and remaining manual review.
