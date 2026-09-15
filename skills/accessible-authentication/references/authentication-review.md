# Authentication review guide

## Decide what is being assessed

Separate initial account creation, authentication of an existing account,
account recovery, and session reauthentication. WCAG 2.2 SC 3.3.8 concerns
authentication; apply helpful entry techniques to signup without presenting all
signup rules as requirements of that criterion. Trace one complete usable path
through every mandatory factor, including challenges shown only after failures.

A password is not automatically a failure: support for password managers or
copy/paste can reduce the memory/transcription burden. Evaluate the actual
mechanism. Object recognition and recognition of user-provided non-text content
have exceptions at AA; do not claim every CAPTCHA fails, or that an audio
transcription alternative necessarily solves the barrier. Label more inclusive
recommendations separately from minimum requirements.

## Entry and recovery checklist

- Use meaningful native username/password controls with appropriate autocomplete
  purposes. Preserve password-manager detection, autofill, paste, and the value
  when visibility is toggled. Do not log credentials or attach real recovery
  links to evidence.
- For OTPs, prefer one input when it meets the design need. If split fields are
  retained, allow a complete pasted code, preserve leading zeroes, give each
  field a meaningful position label, and test selection/replacement, Backspace,
  mobile autofill, and submission. Do not force a rewrite solely because a
  correctly working split control exists.
- Test paste through the clipboard path, not `fill()`, which bypasses paste
  handlers. Synthetic ClipboardEvents test handler logic only; record that
  limitation. Use an actual browser clipboard and keyboard paste where
  available.
- Check invalid, expired, resent, and already-used codes with deterministic test
  responses. Errors must be discoverable and connected to the input; clear
  obsolete errors after correction. Avoid automatic submission that prevents
  users reviewing or correcting a code.
- Review session expiry warnings, supported extension/recovery behavior, and
  preservation of work after reauthentication. Timing requirements have
  exceptions; establish applicability before diagnosing a failure. Do not alter
  expiry duration without product/security context.
- Include accessible entry, cancellation, fallback, and return from third-party
  or device-mediated authentication. A browser test cannot establish the
  accessibility of an OS passkey dialog or external provider.

## Evidence and regression design

Record the test path, starting state, input mechanism, expected completion,
observed focus/error state, and result without including secret values. A useful
regression pastes a synthetic whole code and submits it successfully, then tries
invalid input, corrects it, and succeeds. Test zero-prefixed codes, resend, and
empty submission. Keep a valid native password input and a functioning OTP
control as negative controls; adding redundant ARIA or removing security is not
a repair.

## Manual verification

Record OS, browser/version, assistive technology/version, password
manager/version, date, and path. With a representative supported screen reader,
navigate by form controls, identify the challenge and instructions, submit an
invalid code, locate the error, correct it, and complete authentication. Record
actual speech and focus rather than an expected speech string as a pass. Repeat
paste and autofill with the supported password manager and mobile browser;
record untested external/device steps as pending. Human review decides whether
alternatives are practically usable.

## Sources and applicability

Original implementation guidance; source links checked 2026-09-14. WCAG
Understanding pages explain normative criteria; their examples are not the only
permitted implementations.

- [Accessible Authentication (Minimum), 3.3.8 AA](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html):
  cognitive tests, assistance mechanisms, and exceptions.
- [Identify Input Purpose, 1.3.5 AA](https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html):
  programmatically identified input purposes where applicable.
- [Timing Adjustable, 2.2.1 A](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html):
  timing controls and exceptions.
