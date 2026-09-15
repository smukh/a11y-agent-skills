---
name: accessible-combobox-and-autocomplete
description:
  Reviews editable comboboxes and suggestion popups, including async search,
  active options, selection, and dismissal. Use for autocomplete or custom
  select accessibility; ordinary native selects need no custom keyboard model.
license: MIT
metadata:
  version: "1.0"
---

# Accessible combobox and autocomplete

## Workflow

1. Identify editable versus select-only behavior and whether a native select
   meets the actual requirement. Read
   [the combobox review guide](references/combobox-review.md) for the selected
   variant.
2. Inventory closed/open, loading, results, empty, error, selected, and cleared
   states. Document focus, active option, committed value, and keyboard behavior
   separately.
3. Replay typing, option navigation, acceptance, Escape, Tab, and rapid request
   changes. Verify that active references identify current options and normal
   text editing remains available.
4. Repair state ownership and semantics together. Add tests for out-of-order
   results, selection correctness, dismissal, and the supported keyboard path.
5. Follow the guide's manual checks for screen-reader state announcements,
   editing, and mobile input.

## Boundaries

A listbox popup is one variant; tree, grid, and dialog popups have different
responsibilities. Do not paste a listbox keyboard model onto all variants.
General form errors remain in accessible-forms; this skill owns suggestion and
selection behavior.
