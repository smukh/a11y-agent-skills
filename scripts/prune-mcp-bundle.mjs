import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const bundleRoot = resolve(repositoryRoot, "packages/mcp/bundle");

for (const entry of await readdir(bundleRoot, { withFileTypes: true })) {
  if (!entry.name.endsWith(".d.ts") && !entry.name.endsWith(".d.ts.map"))
    continue;
  await rm(resolve(bundleRoot, entry.name), { force: true });
}

const axeSource = resolve(
  repositoryRoot,
  "packages/core/node_modules/axe-core"
);
const axeTarget = resolve(bundleRoot, "node_modules/axe-core");
await mkdir(axeTarget, { recursive: true });
for (const name of [
  "axe.js",
  "package.json",
  "LICENSE",
  "LICENSE-3RD-PARTY.txt"
]) {
  await copyFile(resolve(axeSource, name), resolve(axeTarget, name));
}
