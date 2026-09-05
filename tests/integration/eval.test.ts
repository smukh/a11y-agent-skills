import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { makeFinding, makeReport } from "../helpers/report.js";

const temporaryDirectories: string[] = [];
afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe("evaluation runner", () => {
  it("scores deterministic evidence and an independent conservative-fix review", async () => {
    const directory = await mkdtemp(join(tmpdir(), "a11y-agent-eval-"));
    temporaryDirectories.push(directory);
    const beforePath = join(directory, "before.json");
    const afterPath = join(directory, "after.json");
    const reviewPath = join(directory, "review.json");
    const outputPath = join(directory, "result.json");
    await Promise.all([
      writeFile(
        beforePath,
        JSON.stringify(makeReport([makeFinding({ ruleId: "color-contrast" })]))
      ),
      writeFile(afterPath, JSON.stringify(makeReport([]))),
      writeFile(
        reviewPath,
        JSON.stringify({
          schemaVersion: "1.0.0",
          reviewer: "fixture-contract",
          prohibitedOrMisleadingFixes: [],
          notes: ["The repaired fixture retains its content and interaction."]
        })
      )
    ]);
    await promisify(execFile)(
      "pnpm",
      [
        "exec",
        "tsx",
        "evals/run.ts",
        "--before",
        beforePath,
        "--after",
        afterPath,
        "--case",
        "low-contrast",
        "--model",
        "fixture-model",
        "--review",
        reviewPath,
        "--output",
        outputPath
      ],
      { cwd: resolve(".") }
    );
    const result = JSON.parse(await readFile(outputPath, "utf8")) as {
      score: number;
      maxScore: number;
      publishable: boolean;
      checks: Array<{ id: string; passed: boolean }>;
    };
    expect(result.score).toBe(result.maxScore);
    expect(result.publishable).toBe(false);
    expect(
      result.checks.find((check) => check.id === "conservative-fix-review")
        ?.passed
    ).toBe(true);
  });
});
