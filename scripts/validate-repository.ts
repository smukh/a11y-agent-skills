import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import process from "node:process";

const expectedSkills = [
  "accessibility-audit",
  "fix-accessibility-issue",
  "keyboard-navigation-review",
  "accessible-forms",
  "dialog-accessibility",
  "accessible-component-review",
  "accessibility-regression-test"
].sort();
const errors: string[] = [];

async function json(path: string): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await readFile(resolve(path), "utf8")) as Record<
      string,
      unknown
    >;
  } catch (error) {
    errors.push(
      `${path}: invalid JSON (${error instanceof Error ? error.message : "unknown error"})`
    );
    return {};
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

async function filesUnder(root: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (["node_modules", "dist", "dist-types", ".git"].includes(entry.name))
      continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(path)));
    else files.push(path);
  }
  return files;
}

const packagePaths = [
  "package.json",
  "plugin.json",
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  "packages/core/package.json",
  "packages/cli/package.json",
  "packages/mcp/package.json",
  "packages/github-action/package.json",
  "fixtures/react/package.json"
];
const manifests = await Promise.all(packagePaths.map(json));
const versions = new Set(manifests.map((manifest) => manifest.version));
if (versions.size !== 1 || !versions.has("0.1.0"))
  errors.push(`versions drifted: ${[...versions].join(", ")}`);

const actualSkills = (await readdir(resolve("skills"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
if (JSON.stringify(actualSkills) !== JSON.stringify(expectedSkills))
  errors.push("canonical skill set differs from the seven advertised skills");
const claude = manifests[3];
const claudeSkills = Array.isArray(claude?.skills)
  ? (claude.skills as string[]).map((path) => path.split("/").at(-1)).sort()
  : [];
if (JSON.stringify(claudeSkills) !== JSON.stringify(expectedSkills))
  errors.push("Claude manifest skill list drifted");
if (manifests[2]?.skills !== "./skills/")
  errors.push("Codex manifest must discover ./skills/ directly");

for (const packagePath of packagePaths.filter((path) =>
  path.startsWith("packages/")
)) {
  const manifest = await json(packagePath);
  const exportsField = manifest.exports;
  if (!exportsField) errors.push(`${packagePath}: package exports are missing`);
}

for (const schema of [
  "evals/cases/catalog.json",
  "evals/expected/catalog.json",
  "evals/review-schema.json",
  "mcp.json",
  ".mcp.json"
])
  await json(schema);

const publicMcp = await json("mcp.json");
const pluginMcp = await json(".mcp.json");
const publicMcpContract = { ...publicMcp };
delete publicMcpContract.$schema;
if (JSON.stringify(publicMcpContract) !== JSON.stringify(pluginMcp))
  errors.push("mcp.json and .mcp.json server definitions drifted");

const markdownFiles = (await filesUnder(process.cwd())).filter((path) =>
  path.endsWith(".md")
);
for (const file of markdownFiles) {
  const text = await readFile(file, "utf8");
  for (const match of text.matchAll(/\[[^\]]+\]\((?!https?:|#)([^)]+)\)/g)) {
    const target = match[1]?.split("#")[0];
    if (target && !(await exists(resolve(dirname(file), target)))) {
      errors.push(
        `${relative(process.cwd(), file)}: broken local link ${target}`
      );
    }
  }
  if (
    file.includes(`${sep}skills${sep}`) &&
    file.includes(`${sep}references${sep}`) &&
    /Copyright ©? 20\d\d W3C/.test(text)
  ) {
    errors.push(
      `${relative(process.cwd(), file)}: copied standards copyright block; link and summarize instead`
    );
  }
}

for (const skill of actualSkills) {
  const scripts = resolve("skills", skill, "scripts");
  if (
    (await exists(scripts)) &&
    !(await exists(resolve("tests", "skills", skill)))
  ) {
    errors.push(`skills/${skill}: scripts exist without tests/skills/${skill}`);
  }
}

for (const mirror of [".claude/skills", ".codex/skills", ".cursor/skills"]) {
  if (await exists(resolve(mirror)))
    errors.push(
      `${mirror}: generated mirror is not allowed; use canonical skills/`
    );
}

const actionDist = resolve("packages/github-action/dist");
if (await exists(actionDist)) {
  for (const generatedFile of ["index.d.ts", "index.d.ts.map"]) {
    if (await exists(resolve(actionDist, generatedFile)))
      errors.push(
        `packages/github-action/dist/${generatedFile}: generated declaration artifact must be pruned`
      );
  }
  const actionBundle = resolve(actionDist, "index.cjs");
  if (!(await exists(actionBundle))) {
    errors.push(
      "packages/github-action/dist/index.cjs: self-contained Action bundle is missing"
    );
  } else {
    const bundle = await readFile(actionBundle, "utf8");
    const localHome = process.env.HOME;
    if (localHome && bundle.includes(localHome))
      errors.push("GitHub Action bundle contains an absolute local home path");
  }
  for (const vendoredFile of [
    "node_modules/axe-core/axe.js",
    "node_modules/axe-core/LICENSE",
    "node_modules/axe-core/LICENSE-3RD-PARTY.txt"
  ]) {
    if (!(await exists(resolve(actionDist, vendoredFile))))
      errors.push(
        `packages/github-action/dist/${vendoredFile}: required vendored runtime file is missing`
      );
  }
}

const mcpBundle = resolve("packages/mcp/bundle/index.cjs");
if (!(await exists(mcpBundle))) {
  errors.push(
    "packages/mcp/bundle/index.cjs: self-contained plugin bundle is missing"
  );
} else {
  const bundle = await readFile(mcpBundle, "utf8");
  const localHome = process.env.HOME;
  if (localHome && bundle.includes(localHome))
    errors.push("MCP bundle contains an absolute local home path");
}

const mcpArgs = (
  (
    pluginMcp.mcpServers as Record<string, Record<string, unknown>> | undefined
  )?.["a11y-agent"]?.args as unknown[] | undefined
)?.map(String);
if (!mcpArgs?.includes("${PLUGIN_ROOT}/packages/mcp/bundle/index.cjs")) {
  errors.push(
    "plugin MCP config must execute the committed self-contained bundle"
  );
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Repository manifests, versions, links, schemas, package exports, and skill contracts are synchronized.\n"
  );
}
