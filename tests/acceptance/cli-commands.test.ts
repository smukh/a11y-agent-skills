import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  auditReportSchema,
  comparisonReportSchema,
  journeyReportSchema,
  verificationReportSchema
} from "../../packages/core/src/index.js";
import { startFixtureServer } from "../helpers/fixture-server.js";

const execute = promisify(execFile);
const cli = process.env.A11Y_AGENT_CLI_ENTRY
  ? resolve(process.env.A11Y_AGENT_CLI_ENTRY)
  : resolve("packages/cli/dist/index.js");
const runtime = process.env.A11Y_AGENT_RUNTIME ?? process.execPath;
const fixture = resolve("fixtures/static/gallery-broken.html");
const journey = resolve("fixtures/static/journeys/dialog-close-restore.json");
let server: Awaited<ReturnType<typeof startFixtureServer>> | undefined;
let temporaryDirectory = "";

async function runCli(args: string[]) {
  return execute(runtime, [cli, ...args], {
    cwd: process.cwd(),
    timeout: 120_000,
    maxBuffer: 10_000_000
  });
}

beforeAll(async () => {
  server = await startFixtureServer();
  temporaryDirectory = await mkdtemp(join(tmpdir(), "a11y-agent-cli-"));
});

afterAll(async () => {
  await server?.close();
  if (temporaryDirectory)
    await rm(temporaryDirectory, { recursive: true, force: true });
});

describe("CLI command acceptance", () => {
  it("runs doctor, scan, compare, verify, keyboard, and output-file paths as subprocesses", async () => {
    if (!server) throw new Error("Fixture server did not start.");

    const doctor = await runCli(["doctor"]);
    expect((JSON.parse(doctor.stdout) as { ok: boolean }).ok).toBe(true);

    const common = [
      "--state",
      "gallery",
      "--route",
      "/gallery",
      "--ready-selector",
      "body"
    ];
    const broken = auditReportSchema.parse(
      JSON.parse(
        (
          await runCli([
            "scan",
            `${server.origin}/gallery-broken.html`,
            ...common
          ])
        ).stdout
      ) as unknown
    );
    expect(broken.findings.length).toBeGreaterThan(0);

    const beforePath = join(temporaryDirectory, "before.json");
    const afterPath = join(temporaryDirectory, "after.json");
    const comparisonPath = join(temporaryDirectory, "comparison.json");
    await writeFile(beforePath, JSON.stringify(broken), "utf8");

    await runCli([
      "scan",
      `${server.origin}/gallery-repaired.html`,
      ...common,
      "--output",
      afterPath
    ]);
    const repaired = auditReportSchema.parse(
      JSON.parse(await readFile(afterPath, "utf8")) as unknown
    );
    expect(repaired.findings).toHaveLength(0);

    await runCli([
      "compare",
      beforePath,
      afterPath,
      "--output",
      comparisonPath
    ]);
    const comparison = comparisonReportSchema.parse(
      JSON.parse(await readFile(comparisonPath, "utf8")) as unknown
    );
    expect(comparison.resolved.length).toBeGreaterThan(0);

    const scanComparison = comparisonReportSchema.parse(
      JSON.parse(
        (
          await runCli([
            "scan",
            `${server.origin}/gallery-repaired.html`,
            ...common,
            "--baseline",
            beforePath
          ])
        ).stdout
      ) as unknown
    );
    expect(scanComparison.resolved.length).toBeGreaterThan(0);

    const verification = verificationReportSchema.parse(
      JSON.parse(
        (
          await runCli([
            "verify",
            `${server.origin}/gallery-repaired.html`,
            ...common,
            "--baseline",
            beforePath
          ])
        ).stdout
      ) as unknown
    );
    expect(verification.status).toBe("verified");

    const keyboard = journeyReportSchema.parse(
      JSON.parse(
        (
          await runCli([
            "keyboard",
            `${server.origin}/gallery-repaired.html`,
            "--journey",
            journey
          ])
        ).stdout
      ) as unknown
    );
    expect(keyboard.passed).toBe(true);
  }, 120_000);

  it("returns a failing process status when an explicit impact threshold is met", async () => {
    await expect(
      runCli(["scan-html", fixture, "--fail-on", "serious"])
    ).rejects.toMatchObject({ code: 1 });
  }, 30_000);
});
