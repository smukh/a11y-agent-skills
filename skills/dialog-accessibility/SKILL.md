---
name: dialog-accessibility
description:
  Reviews or repairs modal and non-modal dialog behavior, including naming,
  initial focus, containment, Escape, inert background, close controls, and
  focus restoration. Use for dialog, modal, drawer, popover-as-dialog, or
  focus-trap work.
license: MIT
metadata:
  version: "1.0"
---

# Dialog accessibility

Verify the whole open–operate–close lifecycle.

## Workflow

1. Decide whether native `<dialog>` meets the product behavior before retaining
   a custom dialog.
2. Open it from a known invoker and apply
   [references/dialog-checklist.md](references/dialog-checklist.md).
3. Verify the accessible name and any useful description, deliberate initial
   focus, containment for a modal, background inertness, keyboard-operable close
   control, Escape behavior, and restoration to the logical invoker.
4. Test close by every offered path and test DOM removal or route changes that
   invalidate the invoker.
5. Replay at mobile width and high zoom. Assess nested dialogs as a separate
   high-risk interaction.
6. Save a bounded keyboard journey and rerun the relevant deterministic scan
   after repairs.

## Boundaries

Do not force focus to the first interactive control when a heading or
explanatory content is the more useful starting point. Do not add `role=dialog`
without implementing the interaction model. A passing axe scan does not prove
containment, restoration, or mobile usability.
