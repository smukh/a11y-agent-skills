import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { auditReportSchema } from "../../packages/core/src/index.js";

const run = promisify(execFile);
const cli = resolve("packages/cli/dist/index.js");
const fixture = resolve("fixtures/static/gallery-broken.html");

describe("CLI formats", () => {
  it("emits schema-valid JSON", async () => {
    const { stdout } = await run(process.execPath, [
      cli,
      "scan-html",
      fixture,
      "--format",
      "json"
    ]);
    expect(
      auditReportSchema.parse(JSON.parse(stdout) as unknown).reportType
    ).toBe("audit");
  });

  it("emits Markdown and valid SARIF", async () => {
    const markdown = await run(process.execPath, [
      cli,
      "scan-html",
      fixture,
      "--format",
      "markdown"
    ]);
    expect(markdown.stdout).toContain("# Accessibility audit report");
    const sarif = await run(process.execPath, [
      cli,
      "scan-html",
      fixture,
      "--format",
      "sarif"
    ]);
    expect((JSON.parse(sarif.stdout) as { version: string }).version).toBe(
      "2.1.0"
    );
  });

  it("never includes inline script secrets from static HTML", async () => {
    const source = await readFile(fixture, "utf8");
    expect(source).not.toContain("super-secret");
    const { stdout } = await run(process.execPath, [cli, "scan-html", fixture]);
    expect(stdout).not.toMatch(/authorization.*bearer/i);
  });
});
