---
name: keyboard-navigation-review
description:
  Reviews repeatable keyboard-only journeys for reachability, focus order,
  traps, skip links, composite widgets, and focus restoration. Use for keyboard
  navigation, focus, tab order, menu keys, or keyboard-trap requests.
license: MIT
metadata:
  version: "1.0"
---

# Keyboard navigation review

Evaluate a bounded task with real browser key presses. Synthetic keyboard
evidence is useful but is not complete assistive-technology evidence.

## Workflow

1. Define the starting URL/state, viewport, task completion condition, and
   expected focus behavior.
2. Run `a11y-agent keyboard <url> --journey <file>` or perform the equivalent
   physical-key review. Journey files must use only the bounded actions in
   [references/journey-review.md](references/journey-review.md); never add
   arbitrary JavaScript.
3. Check reachability, visible focus, logical sequence, traps, skip links,
   composite-widget arrow-key behavior, route/state changes, dialog entry, and
   focus restoration.
4. Record every action, resulting focused element, accessible name, and failure
   reason.
5. Replay any repair from the identical starting state and add a
   behavior-focused regression journey.

## Boundaries

Do not infer that a passing scripted journey works with every keyboard layout,
switch device, voice input system, browser, or screen reader. Manual review
remains required for visual focus quality and task-level sequence judgment.
