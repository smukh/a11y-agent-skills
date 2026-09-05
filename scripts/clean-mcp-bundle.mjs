import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
await rm(resolve(repositoryRoot, "packages/mcp/bundle"), {
  recursive: true,
  force: true
});
