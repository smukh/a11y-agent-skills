import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execute = promisify(execFile);
const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

async function runPnpm(
  args: string[],
  options: { env?: NodeJS.ProcessEnv } = {}
): Promise<void> {
  await execute(process.platform === "win32" ? "pnpm.cmd" : "pnpm", args, {
    cwd: repositoryRoot,
    env: { ...process.env, ...options.env },
    timeout: 240_000,
    maxBuffer: 20_000_000
  });
}

const temporaryDirectory = await mkdtemp(
  join(tmpdir(), "a11y-agent-package-install-")
);
try {
  const packDirectory = join(temporaryDirectory, "packs");
  const consumerDirectory = join(temporaryDirectory, "consumer");
  await Promise.all([
    mkdir(packDirectory, { recursive: true }),
    mkdir(consumerDirectory, { recursive: true })
  ]);

  for (const packageName of [
    "@a11y-agent/core",
    "@a11y-agent/cli",
    "@a11y-agent/mcp"
  ]) {
    await runPnpm([
      "--filter",
      packageName,
      "pack",
      "--pack-destination",
      packDirectory
    ]);
  }

  const tarballs = (await readdir(packDirectory))
    .filter((name) => name.endsWith(".tgz"))
    .map((name) => join(packDirectory, name));
  if (tarballs.length !== 3)
    throw new Error(
      `Expected 3 package tarballs, received ${tarballs.length}.`
    );

  await writeFile(
    join(consumerDirectory, "package.json"),
    '{"private":true,"type":"module"}\n',
    "utf8"
  );
  await execute(
    process.platform === "win32" ? "npm.cmd" : "npm",
    [
      "install",
      "--cache",
      join(temporaryDirectory, "npm-cache"),
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      ...tarballs
    ],
    {
      cwd: consumerDirectory,
      env: process.env,
      timeout: 240_000,
      maxBuffer: 20_000_000
    }
  );

  const installedRoot = join(consumerDirectory, "node_modules/@a11y-agent");
  await runPnpm(
    [
      "exec",
      "vitest",
      "run",
      "tests/acceptance/cli-commands.test.ts",
      "tests/acceptance/mcp-stdio.test.ts"
    ],
    {
      env: {
        A11Y_AGENT_CLI_ENTRY: join(installedRoot, "cli/dist/index.js"),
        A11Y_AGENT_MCP_ENTRY: join(installedRoot, "mcp/dist/index.js"),
        A11Y_AGENT_RUNTIME:
          process.env.A11Y_AGENT_CONSUMER_NODE ?? process.execPath
      }
    }
  );

  process.stdout.write(
    "Installed core, CLI, and MCP tarballs in an empty npm project; all CLI commands and all six MCP tools passed.\n"
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
