---
name: accessible-authentication
description:
  Reviews login, MFA, one-time codes, recovery, and reauthentication for
  accessible completion. Use for authentication-specific accessibility; use
  accessible-forms for general labeling and validation.
license: MIT
metadata:
  version: "1.0"
---

# Accessible authentication

## Workflow

1. Map each available authentication path and its initial, invalid, expired,
   retry, and successful states. Use test accounts and synthetic codes; preserve
   the site's security policy.
2. Read [the authentication review guide](references/authentication-review.md)
   for cognitive burden, credential entry, recovery, and policy boundaries.
3. Replay whole-value paste, password-manager entry where available, keyboard
   submission, and error recovery. Record what was actually exercised rather
   than inferring support from autocomplete markup.
4. Repair the source that owns the barrier. Re-run the same path, including
   failure and retry, and add a behavioral test for the supported input
   mechanism.
5. Follow the guide's manual checks for browser/password-manager and
   screen-reader behavior; report untested combinations explicitly.

## Boundaries

General form labels and validation remain in accessible-forms. This skill owns
the complete authentication path, including challenges outside the initial form.
Do not remove MFA, weaken rate limits, change account enumeration behavior, or
invent a recovery policy. A passing clipboard test does not prove
password-manager support or WCAG conformance.
