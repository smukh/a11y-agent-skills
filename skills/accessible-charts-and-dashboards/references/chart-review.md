# Chart and dashboard review guide

## Start from the task and source data

Establish what users must learn or do: identify a trend, obtain exact values,
compare categories, filter a series, or inspect a point. Obtain the source data,
units, aggregation, date range, missing-value conventions, and filter state. A
screenshot alone cannot reliably establish these facts. Ask for missing meaning
when a useful alternative depends on it.

Use a concise name/context and an appropriate detailed representation. A visible
summary plus a data table can support trends and exact values; a structured long
description or other representation may suit a diagram better. A table alone may
omit the important relationship the visualization communicates. Have a human
confirm the description's accuracy and usefulness. Do not copy source values
into an independently maintained stale table.

## Information and interaction checklist

- Share the filtered/aggregated dataset between visual and alternative
  renderers. Preserve labels, units, date ranges, ordering, missing values, and
  precision. Zero and unavailable are not interchangeable.
- Make legends and distinctions understandable without color alone. Check text
  and meaningful graphical contrast as applicable; do not apply text thresholds
  mechanically to every decorative line.
- Make hover-revealed values available through a usable keyboard/focus path or
  equivalent representation. Review tooltip dismissal, persistence, and
  hoverability where applicable.
- Ensure filters, range selectors, series toggles, drilldown, and reset have
  usable names, states, and keyboard operation. An exported CSV does not by
  itself provide an equivalent interactive task.
- Choose manageable navigation for dense plots: grouping, summaries, or an
  accessible alternative may be better than thousands of tab stops. Do not
  expose every SVG path as an unnamed control.
- Update the title/context and detailed alternative with each filter. Preserve
  focus on the operated control during passive redraws and announce useful
  completion/count information when appropriate.
- Treat loading, empty, error, partial, and real-time states explicitly. Do not
  leave old values presented as current during failure or replace an unknown
  value with a fabricated zero.

## Evidence and regression design

Use known fixture data and compare the represented values, labels, and units
after filtering. Test a second filter, reset, empty results, and missing values.
Assert equivalent user information rather than a particular chart library's
internal SVG structure. Test keyboard access to the same values and actions
available on hover. Protect a simple static chart with a correct visible summary
and table: extra ARIA and per-mark focus are not automatically improvements.

## Manual verification

Record OS/browser/AT versions, date, dataset/filter, and task. With a supported
screen reader, find the chart purpose, obtain an exact value, compare two
categories, change a filter, and confirm the alternative reflects it. Ask a
reviewer familiar with the data to judge whether summaries preserve essential
relationships and uncertainty. At zoom and forced colors, inspect labels, legend
distinctions, selected state, tooltip readability, and control reachability.
Record any chart-library/AT limitations rather than generalizing from a DOM
snapshot.

## Sources and applicability

Original guidance; links checked 2026-09-14.

- [WAI Complex Images tutorial](https://www.w3.org/WAI/tutorials/images/complex/):
  short and detailed alternatives for essential information.
- [Non-text Content, 1.1.1 A](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html):
  alternatives appropriate to purpose.
- [Use of Color, 1.4.1 A](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html):
  information conveyed beyond color.
- [Content on Hover or Focus, 1.4.13 AA](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html):
  applicable additional-content behavior.
