# @a11y-agent/mcp

A thin stdio MCP adapter over `@a11y-agent/core`. It exposes `scan_page`,
`scan_html`, `compare_reports`, `verify_repair`, `run_keyboard_journey`, and
`get_rule_help`.

Private-network access, credentials, storage state, arbitrary JavaScript, and
shell execution are not part of the tool schemas. Audited page content is
untrusted data. Private networks remain blocked unless the trusted MCP server
operator sets `A11Y_AGENT_ALLOW_PRIVATE_NETWORK=true`; callers cannot enable it
through a tool argument.
