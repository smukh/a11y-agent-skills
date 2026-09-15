---
name: accessible-data-tables-and-grids
description:
  Reviews native data tables and interactive grids, including sorting, editing,
  selection, pagination, and virtualized rows. Use for tabular-data
  accessibility rather than CSS layout grids.
license: MIT
metadata:
  version: "1.0"
---

# Accessible data tables and grids

## Workflow

1. Identify the actual task and choose table or grid semantics using
   [the table and grid review guide](references/table-grid-review.md). Preserve
   valid native tables.
2. Inventory headers, sort state, selection, editing, row actions, pagination,
   and virtualization. Only assess behaviors the product implements.
3. Replay navigation and mutations using stable record identities. Check what
   happens to focus and selection when rows reorder, disappear, or leave the
   rendered window.
4. Repair the owning component, preserving data and supported interactions. Test
   navigation and the same sort/edit/delete sequence against broken and repaired
   states.
5. Apply the guide's manual reading and interaction checks, recording actual AT
   results separately from DOM and keyboard evidence.

## Boundaries

Do not assign role=grid merely because a table contains buttons or sortable
headers. APG is design guidance, not an independent conformance standard.
Logical row indices do not establish that virtualized content can actually be
reached with assistive technology.
