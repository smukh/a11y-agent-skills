---
name: accessible-forms
description:
  Reviews and repairs accessible form labeling, instructions, autocomplete,
  grouping, validation, error summaries, announcements, redundant entry, and
  authentication. Use for form, field, label, validation, error-message,
  autocomplete, or login accessibility work.
license: MIT
metadata:
  version: "1.0"
---

# Accessible forms

Review the user journey, not isolated inputs.

## Workflow

1. Identify every available state: initial, invalid submission, corrected input,
   and successful submission. Test at least initial, invalid, and successful
   states when they exist.
2. Apply [references/forms-checklist.md](references/forms-checklist.md) to
   labels, instructions, required communication, autocomplete, grouping, and
   authentication.
3. Submit invalid data. Verify errors are identified in text, programmatically
   connected to fields, announced or focused appropriately, and summarized when
   the form size warrants it.
4. Correct the form and verify stale error state is removed without losing
   needed instructions.
5. Prefer native form elements and associations. Add live regions only for
   dynamic changes that need announcement; avoid duplicate announcements.
6. Preserve the deterministic scan and interaction evidence, then add a
   user-behavior regression test.

## Boundaries

Do not invent labels, requirements, validation copy, autocomplete purpose, or
authentication policy. Escalate missing product meaning for human decision. A
machine-detectable label does not establish that the label is clear or correct.
