# Combobox and autocomplete review guide

## Choose a variant

Preserve a working native select for a fixed selection list. A custom combobox
can be justified by editable search or other actual requirements. Establish
whether typing is free text, whether selection is required, and when a value
commits. Do not invent that policy during an accessibility repair.

Identify the popup type and relevant APG variant. For a listbox-backed editable
combobox, keep DOM focus in the input while `aria-activedescendant` identifies
the active option when appropriate. For a dialog popup, focus may move into the
dialog and its focus model applies. Active, selected, and committed values are
separate concepts.

## Semantics and keys

- Provide a meaningful label, expanded state, and a valid relationship to the
  popup. Match autocomplete semantics to implemented behavior; setting
  `aria-autocomplete` does not implement suggestions.
- With virtual focus, reference an existing, visible current option belonging to
  the controlled popup. Clear stale active references on close, empty results,
  and replacement. Do not reuse an ID for a different logical option while
  treating it as unchanged.
- For the chosen listbox variant, exercise Down/Up, Enter acceptance, Escape
  dismissal, Tab leaving the control, and reopening. Define whether first/last
  navigation wraps; avoid presenting optional APG choices as universal
  requirements.
- Preserve Left/Right, Home/End, selection shortcuts, deletion, and other native
  text-editing keys in editable input. Do not intercept Enter while an IME
  composition is active.
- Keep options perceivable when active: scroll into view without moving the
  whole page unexpectedly. Pointer selection and keyboard acceptance should
  commit the same value.
- Communicate loading, no results, and failure appropriately; these messages are
  not selectable suggestions. Avoid announcing the entire list on each
  keystroke.

## Async state invariants

Tie responses to request identity or the current query, including repeated
queries. Cancel or ignore old responses. After results change, retain the active
logical option only if it still exists; otherwise choose the documented reset
behavior and update or clear the reference. Closing the popup must also prevent
pending responses from unexpectedly reopening it.

Test a slow earlier query completing after a fast later query, clear while
loading, Escape while loading, error then retry, no results, and selection after
a refresh. Test input composition separately from ordinary ASCII typing. A
debounce alone does not prevent response races.

## Evidence and regression design

Record query, response order, current options, active ID and text, selected
value, expanded state, and focused element. Control network response order in
the test rather than sleeping and hoping to reproduce the race. Assert both that
the active reference resolves and that it points to a result for the current
query. A valid ID can still name the wrong result. Protect a native select as a
negative control; do not replace it or layer redundant combobox/listbox roles
onto it.

## Manual verification

Record OS, browser, AT versions, date, input language, and variant. With a
supported screen reader, find the label, type a query, hear expansion and active
options, accept an option, reopen, dismiss, and leave with Tab. Repeat
no-results/error paths and rapid typing. Check touch exploration, virtual
keyboard and IME composition where supported. DOM checks cannot prove the spoken
active option or discoverability on mobile; leave these pending when not
exercised.

## Sources and applicability

Original guidance; links checked 2026-09-14.

- [APG Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/):
  advisory variants, keyboard behavior, roles, states, and properties.
- [Name, Role, Value, 4.1.2 A](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html):
  programmatic control information.
- [Keyboard, 2.1.1 A](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html):
  keyboard operability with applicable exceptions.
