# Dynamic update review guide

## Decide what users need to perceive

Classify the event before adding ARIA. A passive save result, search count,
progress state, or error may need programmatic status exposure without moving
focus. A route transition or explicitly opened editing task may need deliberate
focus placement. Ordinary content changes do not all qualify as status messages
under SC 4.1.3. Record the reason for the chosen behavior.

Preserve focus during passive updates. For a new page/view, coordinate page
title, a meaningful destination, history/back behavior, and loading completion.
Do not move focus to a heading on every filter change or after the user has
already continued elsewhere. Review whether sticky UI obscures the chosen
destination.

## Announcement design

- Prefer a stable, initially present status container for non-urgent feedback.
  `role=status` already supplies polite live semantics; additional attributes
  need an actual reason. Keep urgent alerts for situations that justify
  interruption.
- Choose concise, actionable status content using known product meaning. Do not
  announce the whole result list when a count or completion summary suffices.
  Keep detailed content independently navigable.
- Avoid duplicate exposure through an alert, a live ancestor, and a focused
  error simultaneously. Do not combine live attributes indiscriminately; test
  the intended browser/AT pairing.
- `aria-busy` can signal an updating region, but it is not a loading message or
  proof of announcement suppression across AT. Ensure busy clears on completion,
  cancellation, and error.
- Distinguish repeated legitimate events from duplicate rendering. A second
  successful save still needs useful feedback even if the text is identical;
  choose an update strategy and verify its real AT behavior.

## Streaming and asynchronous work

Keep token-by-token output available to read without forcing every token into an
interrupting live region. A separate completion/progress status can be
appropriate; a chat log with meaningful message boundaries is another pattern.
Preserve reading position, provide reachable stop/retry controls, and avoid
forced auto-scroll when the user is reading earlier content.

Cancel or invalidate pending callbacks when work is stopped, retried, or
superseded. A stale success must not overwrite a later error or announce
completion of a cancelled operation. Test overlapping requests, repeated
submissions, an empty response, and failure after partial content. Do not remove
useful partial content unless the product contract calls for it.

## Evidence and regression design

Record initiating action, focus before/during/after, relevant DOM mutations,
final content, and statuses. Assert that streaming content is retained, routine
progress does not use an assertive live ancestor, focus stays on the user's
control, and exactly the intended completion state is exposed after the run. A
MutationObserver is evidence of DOM changes only. Include an ordinary non-live
changing display that does not need a status as a negative control.

## Manual verification

Record OS/browser/AT versions, date, verbosity settings, and starting position.
Initiate an update while navigating elsewhere; note actual speech,
interruptions, focus, and reading position. Repeat success, failure,
cancellation, and retry. For streams, read prior messages while a response
arrives, stop it, restart, and navigate to the completed message. Confirm that
both under-announcement and excessive announcement are assessed. If no AT
session was run, explicitly leave announcement quality pending.

## Sources and applicability

Original guidance; links checked 2026-09-14.

- [Status Messages, 4.1.3 AA](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html):
  messages exposed without receiving focus; scope and examples.
- [Focus Order, 2.4.3 A](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html):
  meaningful and operable focus sequence.
- [APG Alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/): advisory
  alert behavior and interruption cautions.
