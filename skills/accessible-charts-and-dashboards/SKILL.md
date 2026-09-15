---
name: accessible-charts-and-dashboards
description:
  Reviews charts and dashboard interactions for equivalent information access,
  data alternatives, filtering, and nonvisual operation. Use for data
  visualization accessibility when source data and chart purpose can be
  inspected.
license: MIT
metadata:
  version: "1.0"
---

# Accessible charts and dashboards

## Workflow

1. Obtain the chart's purpose, underlying data, units, filters, and user tasks.
   If meaning or data is unavailable, document the gap rather than inventing a
   description.
2. Use [the chart review guide](references/chart-review.md) to choose concise
   context and an appropriate detailed alternative, including interactive task
   equivalence.
3. Compare the visual representation and its alternative across filters,
   empty/loading/error states, and live updates. Test keyboard access to
   controls and information otherwise revealed only on hover.
4. Repair the shared data transformation or rendering source. Add a regression
   that compares visual and alternative values after the same interaction.
5. Perform the guide's manual interpretation, screen-reader, and low-vision
   checks; preserve unresolved meaning judgments for a human reviewer.

## Boundaries

A data table is often useful but is not the only valid alternative. Do not
invent trends, assert that an aria-label makes a chart accessible, expose
thousands of unstructured SVG marks, or remove interactive analysis
functionality to clear a scan.
