# @a11y-agent/github-action

The Action audits an explicit URL, optionally compares an audit baseline,
uploads JSON and SARIF, and fails only at the configured `fail-on` threshold. It
never commits source or opens a pull request.

Passing means no configured failure crossed the selected threshold. It is not
accessibility certification or a WCAG conformance statement.

The runner must have the browser revision required by Playwright 1.58.0. Install
it before invoking the Action:

```yaml
- name: Install Chromium for a11y-agent
  run: npx --yes playwright@1.58.0 install --with-deps chromium
```

For client-rendered pages, set `ready-selector` to a stable element that is
visible only after the state under test has rendered. Reports contain bounded
page evidence and should be treated as potentially sensitive workflow artifacts.
