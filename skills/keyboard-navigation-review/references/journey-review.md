# Journey review checklist

Allowed actions are navigation, named/selected clicks, Tab, Shift+Tab, Enter,
Space, Escape, arrow keys, field fill, bounded selector waits, and
focus/name/visibility/dialog assertions.

Start with focus at a known element. Record skipped interactive content,
unexpected extra stops, positive `tabindex`, off-screen focus, focus loss after
DOM updates, wrapping behavior inside modal dialogs, Escape behavior, and
restoration to the invoker. Composite widgets may use one tab stop and arrow
keys when their established pattern calls for it; do not flatten them into many
tab stops just to satisfy a simplistic assertion.
