#!/usr/bin/env node

void import("./dist/index.js")
  .then(({ startServer }) => startServer())
  .catch((error) => {
    process.stderr.write(
      `a11y-agent-mcp: ${error instanceof Error ? error.message : "server failed"}\n`
    );
    process.exitCode = 1;
  });
