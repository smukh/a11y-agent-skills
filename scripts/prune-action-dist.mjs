import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const actionDist = resolve(repositoryRoot, "packages/github-action/dist");

await Promise.all(
  ["index.d.ts", "index.d.ts.map"].map((name) =>
    rm(resolve(actionDist, name), { force: true })
  )
);
