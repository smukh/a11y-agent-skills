import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execute = promisify(execFile);
const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const expected = [
  "accessibility-audit",
  "accessibility-regression-test",
  "accessible-component-review",
  "accessible-forms",
  "dialog-accessibility",
  "fix-accessibility-issue",
  "keyboard-navigation-review",
  "accessible-authentication",
  "accessible-data-tables-and-grids",
  "accessible-dynamic-updates",
  "accessible-combobox-and-autocomplete",
  "accessible-charts-and-dashboards"
].sort();
const temporaryDirectory = await mkdtemp(
  join(tmpdir(), "a11y-agent-skills-install-")
);

try {
  await execute(
    process.platform === "win32" ? "npx.cmd" : "npx",
    [
      "--yes",
      "skills@1.5.9",
      "add",
      repositoryRoot,
      "--agent",
      "codex",
      "--yes"
    ],
    {
      cwd: temporaryDirectory,
      env: {
        ...process.env,
        npm_config_cache: join(temporaryDirectory, "npm-cache")
      },
      timeout: 120_000,
      maxBuffer: 10_000_000
    }
  );

  const installRoot = join(temporaryDirectory, ".agents/skills");
  const installed = (await readdir(installRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (JSON.stringify(installed) !== JSON.stringify(expected))
    throw new Error(`Installed skills differ: ${installed.join(", ")}`);

  for (const name of installed) {
    const sourceRoot = join(repositoryRoot, "skills", name);
    const sourceFiles = await readdir(sourceRoot, {
      recursive: true,
      withFileTypes: true
    });
    for (const entry of sourceFiles.filter((entry) => entry.isFile())) {
      const sourcePath = join(entry.parentPath, entry.name);
      const relativePath = relative(sourceRoot, sourcePath);
      const source = await readFile(sourcePath);
      const installedFile = await readFile(
        join(installRoot, name, relativePath)
      );
      if (!installedFile.equals(source))
        throw new Error(
          `${name}/${relativePath}: installed resource differs from source.`
        );
    }
  }

  process.stdout.write(
    "npx skills installed all twelve canonical skills for Codex without prompts, and every skill entry and supporting resource matched its source.\n"
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
