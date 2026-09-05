import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const expectedSkills = [
  "accessibility-audit",
  "fix-accessibility-issue",
  "keyboard-navigation-review",
  "accessible-forms",
  "dialog-accessibility",
  "accessible-component-review",
  "accessibility-regression-test"
].sort();

async function json(path: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(resolve(path), "utf8")) as Record<
    string,
    unknown
  >;
}

async function filesUnder(root: string): Promise<string[]> {
  const results: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (
      entry.isDirectory() &&
      entry.name !== "node_modules" &&
      entry.name !== "dist"
    )
      results.push(...(await filesUnder(path)));
    else if (entry.isFile()) results.push(path);
  }
  return results;
}

describe("repository contracts", () => {
  it("discovers exactly the seven canonical skills", async () => {
    const skills = (await readdir(resolve("skills"), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(skills).toEqual(expectedSkills);
    for (const skill of skills)
      await expect(
        stat(resolve("skills", skill, "SKILL.md"))
      ).resolves.toBeDefined();
  });

  it("keeps collection, packages, and host manifest versions synchronized", async () => {
    const manifests = await Promise.all([
      json("package.json"),
      json("plugin.json"),
      json(".codex-plugin/plugin.json"),
      json(".claude-plugin/plugin.json"),
      json("packages/core/package.json"),
      json("packages/cli/package.json"),
      json("packages/mcp/package.json"),
      json("packages/github-action/package.json"),
      json("fixtures/react/package.json")
    ]);
    expect(new Set(manifests.map((manifest) => manifest.version))).toEqual(
      new Set(["0.1.0"])
    );
  });

  it("host manifests expose the canonical tree without mirrors", async () => {
    const codex = await json(".codex-plugin/plugin.json");
    const claude = await json(".claude-plugin/plugin.json");
    expect(codex.skills).toBe("./skills/");
    expect(
      (claude.skills as string[]).map((path) => path.split("/").at(-1)).sort()
    ).toEqual(expectedSkills);
    expect(await stat(resolve("skills"))).toBeDefined();
  });

  it("keeps public and plugin-standard MCP manifests synchronized", async () => {
    const publicMcp = await json("mcp.json");
    const pluginMcp = await json(".mcp.json");
    const publicContract = { ...publicMcp };
    delete publicContract.$schema;
    expect(publicContract).toEqual(pluginMcp);
  });

  it("resolves every local Markdown link", async () => {
    const roots = [
      resolve("README.md"),
      resolve("CONTRIBUTING.md"),
      ...(await filesUnder(resolve("docs"))),
      ...(await filesUnder(resolve("skills")))
    ];
    const failures: string[] = [];
    for (const file of roots.filter((path) => path.endsWith(".md"))) {
      const text = await readFile(file, "utf8");
      for (const match of text.matchAll(
        /\[[^\]]+\]\((?!https?:|#)([^)]+)\)/g
      )) {
        const target = match[1]?.split("#")[0];
        if (!target) continue;
        try {
          await stat(resolve(dirname(file), target));
        } catch {
          failures.push(`${relative(process.cwd(), file)} -> ${target}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("does not ship script-bearing skills without repository tests", async () => {
    for (const skill of expectedSkills) {
      try {
        await stat(resolve("skills", skill, "scripts"));
        await expect(
          stat(resolve("tests", "skills", skill))
        ).resolves.toBeDefined();
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
  });

  it("keeps standards excerpts as links and short original guidance", async () => {
    const references = (await filesUnder(resolve("skills"))).filter((path) =>
      path.includes(`${join("", "references")}`)
    );
    for (const file of references) {
      const text = await readFile(file, "utf8");
      expect(text.length).toBeLessThan(8_000);
      expect(text).not.toMatch(/Copyright ©? 20\d\d W3C/);
    }
  });
});
