# Manual boundaries for an audit

Automation can detect some markup and computed-style failures. It cannot
establish that content is understandable, alternative text conveys the intended
meaning, focus order matches the task, status announcements are useful, or the
experience works with real assistive technologies.

For every state, manually consider keyboard operation, visible focus, reading
order, zoom/reflow, meaningful alternatives, error recovery, motion, touch
target usability, and screen-reader behavior. Record the method and environment
for checks actually performed. Mark all others `required`, not `passed`.
