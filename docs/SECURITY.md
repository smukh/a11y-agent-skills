# Security and privacy model

The default workflow is local-first and has no telemetry. Reports are written
only to stdout or an explicit path with owner-only file permissions.

## Network boundary

Core accepts only HTTP(S), rejects URL credentials, resolves DNS before
navigation, intercepts and rechecks browser requests, rechecks final URLs,
limits redirects, and permanently blocks common cloud metadata targets. Private,
loopback, link-local, reserved, multicast, and unspecified addresses are denied
unless a caller opts in. The CLI treats an explicitly supplied loopback URL as
local intent; private LAN targets require a flag. MCP never opts in on a
caller's behalf.

DNS checks reduce but cannot eliminate all browser/network race conditions. Run
untrusted scans in a container or network sandbox with metadata and internal
services blocked at the network layer.

## Data boundary

Headers and storage state are passed directly to Playwright and represented only
by authentication mode. Secret-shaped strings, signed query values, common token
formats, form values, and `data-*` attributes are redacted from evidence on a
best-effort basis. Static HTML runs with JavaScript disabled and all network
requests blocked. Live pages can still execute their own application JavaScript
inside Playwright. Reports contain bounded DOM and page metadata, so treat them
as potentially sensitive and do not scan hostile pages with credentials or broad
network access.

Journey schemas allow named/selected clicks, bounded keys and fills, waits, and
assertions—never arbitrary JavaScript or shell commands. MCP limits HTML size,
journey steps, timeouts, report input/output sizes, redirects, and concurrent
browsers. Source modifications remain subject to the coding agent's normal
review.

The MCP server blocks private networks by default. A trusted local developer can
set `A11Y_AGENT_ALLOW_PRIVATE_NETWORK=true` in the MCP server environment; do
not enable it in a shared or hosted service without a network sandbox.

## Skill scanning

Static repository contracts run on every pull request.
`.github/workflows/skill-security.yml` runs Cisco's pinned static, bytecode,
pipeline, and local behavioral analyzers without LLM, cloud, or VirusTotal
options. It receives no secrets and does not upload skill content to a model
provider. Scanner output is best-effort evidence, not a security certification.
