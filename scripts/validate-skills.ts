import { readFile, readdir, stat } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import process from "node:process";
import YAML from "yaml";

const root = resolve("skills");
const allowedFields = new Set([
  "name",
  "description",
  "license",
  "compatibility",
  "metadata",
  "allowed-tools"
]);
const errors: string[] = [];

function frontmatter(
  text: string,
  file: string
): Record<string, unknown> | undefined {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!match?.[1]) {
    errors.push(`${file}: missing YAML frontmatter`);
    return undefined;
  }
  try {
    const parsed = YAML.parse(match[1]) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error("frontmatter must be a mapping");
    return parsed as Record<string, unknown>;
  } catch (error) {
    errors.push(
      `${file}: invalid YAML (${error instanceof Error ? error.message : "unknown error"})`
    );
    return undefined;
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

for (const entry of (await readdir(root, { withFileTypes: true })).filter(
  (entry) => entry.isDirectory()
)) {
  const skillRoot = join(root, entry.name);
  const skillFile = join(skillRoot, "SKILL.md");
  const text = await readFile(skillFile, "utf8");
  const data = frontmatter(text, relative(process.cwd(), skillFile));
  if (!data) continue;
  for (const key of Object.keys(data))
    if (!allowedFields.has(key))
      errors.push(`${skillFile}: unsupported frontmatter field ${key}`);
  if (data.name !== entry.name)
    errors.push(`${skillFile}: name must equal directory ${entry.name}`);
  if (
    typeof data.name !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.name) ||
    data.name.length > 64
  ) {
    errors.push(`${skillFile}: invalid skill name`);
  }
  if (
    typeof data.description !== "string" ||
    data.description.length < 20 ||
    data.description.length > 1024 ||
    !/\bUse\b|\bwhen\b/i.test(data.description)
  ) {
    errors.push(
      `${skillFile}: description must explain what the skill does and when to use it`
    );
  }
  if (
    !data.metadata ||
    typeof data.metadata !== "object" ||
    Array.isArray(data.metadata) ||
    typeof (data.metadata as Record<string, unknown>).version !== "string"
  ) {
    errors.push(`${skillFile}: metadata.version must be a quoted string`);
  }
  if (text.split("\n").length > 500)
    errors.push(`${skillFile}: exceeds 500 lines`);
  for (const match of text.matchAll(/\[[^\]]+\]\((?!https?:|#)([^)]+)\)/g)) {
    const target = match[1]?.split("#")[0];
    if (target && !(await exists(resolve(dirname(skillFile), target))))
      errors.push(`${skillFile}: broken link ${target}`);
  }
  const scripts = join(skillRoot, "scripts");
  if (await exists(scripts)) {
    const testRoot = resolve("tests/skills", entry.name);
    if (!(await exists(testRoot)))
      errors.push(
        `${skillRoot}: script-bearing skill has no tests at ${relative(process.cwd(), testRoot)}`
      );
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Validated ${basename(root)} against the Agent Skills frontmatter and resource contract.\n`
  );
}
