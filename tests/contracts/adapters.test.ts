import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import YAML from "yaml";
import { describe, expect, it } from "vitest";

describe("thin adapter contracts", () => {
  it("ships a Node 24 action with explicit failure and private-network inputs", async () => {
    const action = YAML.parse(
      await readFile(resolve("packages/github-action/action.yml"), "utf8")
    ) as {
      inputs: Record<string, unknown>;
      runs: { using: string; main: string };
    };
    expect(action.runs).toEqual({ using: "node24", main: "dist/index.cjs" });
    expect(action.inputs).toHaveProperty("fail-on");
    expect(action.inputs).toHaveProperty("allow-private-network");
  });

  it("keeps adapters on core rather than duplicating axe or Playwright", async () => {
    for (const file of [
      "packages/mcp/src/index.ts",
      "packages/github-action/src/index.ts"
    ]) {
      const source = await readFile(resolve(file), "utf8");
      expect(source).not.toMatch(
        /from ["'](?:axe-core|@axe-core\/playwright|playwright)["']/
      );
      expect(source).toContain("@a11y-agent/core");
    }
  });

  it("resolves built package exports after the build gate", async () => {
    for (const file of [
      "packages/core/dist/index.js",
      "packages/cli/dist/index.js",
      "packages/mcp/dist/index.js"
    ]) {
      await expect(stat(resolve(file))).resolves.toBeDefined();
    }
  });
});
