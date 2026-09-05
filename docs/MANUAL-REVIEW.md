# Manual review

`automated` means the configured deterministic engine observed a testable
condition. `heuristic` means a tool or agent noticed a pattern that still needs
confirmation. `manual-review` means the outcome depends on meaning, usability,
assistive technology, lived experience, or another condition the automation
cannot establish.

At minimum, manually review meaningful alternatives and names, reading/focus
order, visible focus, keyboard completion, zoom and reflow, target usability,
motion, error recovery, announcements, and representative screen-reader
behavior. Include disabled people in product testing where practical.

Record environment, task, steps, observed result, reviewer, and date.
`Not tested` remains a required item; it must not be silently converted to
`passed`. Synthetic keyboard events and accessibility-tree queries are evidence,
but neither alone represents full assistive-technology support.
