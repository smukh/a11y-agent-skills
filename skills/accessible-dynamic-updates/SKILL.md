---
name: accessible-dynamic-updates
description:
  Reviews asynchronous status, SPA transitions, search results, chat, and
  streamed responses for focus continuity and appropriate announcements. Use
  when content changes without a full page reload.
license: MIT
metadata:
  version: "1.0"
---

# Accessible dynamic updates

## Workflow

1. List the initiating action, update type, loading/error/completion states, and
   the user's expected next task.
2. Use [the dynamic update guide](references/dynamic-update-review.md) to decide
   whether to move focus, expose a passive status, or leave an ordinary content
   update alone.
3. Observe focus and live-region mutations during the entire sequence, including
   rapid updates, cancellation, retry, and stale responses. Do not infer speech
   from attributes.
4. Repair the responsible state/announcement logic. Add tests for preserved
   focus, relevant completion feedback, and superseded or cancelled work.
5. Run the guide's manual screen-reader procedure to assess timing, duplication,
   interruption, and reading continuity.

## Boundaries

Generic component semantics remain in accessible-component-review. This skill
owns temporal behavior across states. Do not make every changing subtree live,
use assertive alerts for all updates, or claim that a mutation trace proves a
screen reader announced it.
