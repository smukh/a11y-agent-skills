import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
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
  "keyboard-navigation-review"
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
    const source = await readFile(
      join(repositoryRoot, "skills", name, "SKILL.md"),
      "utf8"
    );
    const installedFile = await readFile(
      join(installRoot, name, "SKILL.md"),
      "utf8"
    );
    if (installedFile !== source)
      throw new Error(`${name}: installed SKILL.md differs from source.`);
  }

  process.stdout.write(
    "npx skills installed all seven canonical skills for Codex without prompts, and every SKILL.md matched its source.\n"
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
