# Table and grid review guide

## Choose the interaction model

Use a native table for data read by row/column, with ordinary tab stops for
embedded controls. Sorting and row buttons alone do not require grid semantics.
Use an interactive grid when the product needs a composite navigation model such
as cell navigation, selection, or editing; adopting the role creates keyboard
and focus responsibilities. CSS Grid layout is unrelated.

For a native table, check caption/context, meaningful headers, `th`
associations, and `scope` for simple relationships. Use explicit associations
when complex headers require them. Do not repair visual layout tables by
inventing data headers. Put sorting controls in headers and expose the current
applicable sort state; retained focus should identify the operated control.

## Grid interaction contract

Document which cells are navigable, which contain controls, how edit mode
starts/ends, and what Tab, arrows, Home/End, Enter, Escape, and selection
commands do. Apply the relevant APG variant rather than requiring every optional
shortcut. Keep one intended entry point for the composite; do not make every
cell an additional tab stop. Within an editor, preserve native text-editing keys
instead of using them to move between cells.

Use stable record and column identities to preserve the user's position during
data mutations. Array indices are positions, not identities. After sorting, the
active record may move; after deleting it, choose a predictable adjacent record
or meaningful fallback and communicate the change. Do not teleport focus back
into the grid after the user has moved elsewhere. If a sort button is activated
outside the grid, preserve that button's focus unless the documented task
requires otherwise.

## Dynamic data

- Expose selection through the appropriate native checkbox or supported grid
  selection model. Distinguish focused, selected, checked, and edited states. Do
  not replace a copyable read-only value with disabled content.
- When only some rows/columns exist in the DOM, convey logical counts and
  indices where required, including header offsets. Unknown totals are different
  from a fabricated known total. Verify that navigation actually loads and
  reaches the intended record.
- Keep focus valid across window recycling. A referenced active descendant must
  exist and identify the correct cell; an ID attached to a recycled row can be
  technically present but semantically wrong.
- Test first/last rows, empty results, loading, failed save, cancelled editing,
  pagination, and return from row actions. Retain user edits or use the
  product's explicit cancellation behavior.
- Review zoom and scrolling without flattening meaningful table relationships. A
  two-dimensional table may need scrolling; surrounding controls and cell text
  still need appropriate reflow.

## Evidence and tests

Record active record/column before and after a mutation, actual focused element,
exposed name/state, selected records, and the saved data. Test that editing
record A, sorting, and editing again still changes A, not the old row index. Add
a native sortable table negative control: do not add grid roles or arrow-key
navigation unnecessarily.

## Manual verification

Record OS, browser, AT versions, date, and dataset. With a supported screen
reader, find the table/grid, obtain its context, read column/row relationships,
operate sort, navigate to an editor, cancel/save, and return after pagination.
Record spoken headers and state changes. Check whether virtualized rows can be
reached in the intended reading/interaction mode; a DOM index check is
insufficient. At zoom, verify the active cell and row actions remain visible and
usable. Report untested combinations rather than claiming universal support.

## Sources and applicability

Original guidance; links checked 2026-09-14.

- [APG Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/):
  interaction variants and focus responsibilities, advisory guidance.
- [WAI Tables tutorial](https://www.w3.org/WAI/tutorials/tables/): native table
  structure and header associations.
- [Info and Relationships, 1.3.1 A](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html):
  programmatic relationships.
- [Reflow, 1.4.10 AA](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html):
  scope of two-dimensional-content exceptions.
