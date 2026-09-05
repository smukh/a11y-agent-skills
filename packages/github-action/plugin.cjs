#!/usr/bin/env node

void import("./dist-types/index.js").catch((error) => {
  process.stderr.write(
    `a11y-agent Action: ${error instanceof Error ? error.message : "startup failed"}\n`
  );
  process.exitCode = 1;
});
