#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import {
  auditReportSchema,
  compareReports,
  comparisonReportSchema,
  findingsAtOrAbove,
  formatJson,
  formatMarkdown,
  formatSarif,
  journeyReportSchema,
  keyboardJourneySchema,
  scanHtml,
  scanPage,
  verifyRepair,
  verificationReportSchema,
  runKeyboardJourney,
  type AnyReport,
  type FailureThreshold
} from "@a11y-agent/core";
import { Command, InvalidArgumentError, Option } from "commander";

type Format = "json" | "markdown" | "sarif";

interface CommonOptions {
  output?: string;
  format: Format;
  state: string;
  route?: string;
  viewport: { width: number; height: number };
  tags: string[];
  include: string[];
  exclude: string[];
  storageState?: string;
  header: string[];
  failOn: FailureThreshold;
  reducedMotion: boolean;
  allowPrivateNetwork: boolean;
  readySelector?: string;
}

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function parseViewport(value: string): { width: number; height: number } {
  const match = /^(\d{3,4})x(\d{3,4})$/i.exec(value);
  if (!match)
    throw new InvalidArgumentError(
      "Viewport must be WIDTHxHEIGHT, for example 1280x720."
    );
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width < 200 || width > 7680 || height < 200 || height > 4320) {
    throw new InvalidArgumentError(
      "Viewport is outside the supported 200–7680 by 200–4320 range."
    );
  }
  return { width, height };
}

function parseTags(value: string): string[] {
  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  if (tags.length === 0)
    throw new InvalidArgumentError(
      "Provide at least one comma-separated axe tag."
    );
  return tags;
}

function parseHeaders(values: string[]): Record<string, string> | undefined {
  if (values.length === 0) return undefined;
  const headers: Record<string, string> = {};
  for (const value of values) {
    const separator = value.indexOf(":");
    if (separator < 1 || /[\r\n]/.test(value))
      throw new InvalidArgumentError("Headers must use the form Name: value.");
    headers[value.slice(0, separator).trim()] = value
      .slice(separator + 1)
      .trim();
  }
  return headers;
}

function localTargetWasExplicit(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      hostname === "::1"
    );
  } catch {
    return false;
  }
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(resolve(path), "utf8")) as unknown;
}

function render(report: AnyReport, format: Format): string {
  if (format === "markdown") return formatMarkdown(report);
  if (format === "sarif") return formatSarif(report);
  return formatJson(report);
}

async function emit(
  report: AnyReport,
  options: { output?: string; format: Format }
): Promise<void> {
  const text = render(report, options.format);
  if (!options.output) {
    process.stdout.write(text);
    return;
  }
  const path = resolve(options.output);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text, { encoding: "utf8", mode: 0o600 });
}

function addSharedOptions(command: Command): Command {
  return command
    .option("-o, --output <path>", "write output to an explicit path")
    .addOption(
      new Option("-f, --format <format>", "output format")
        .choices(["json", "markdown", "sarif"])
        .default("json")
    )
    .option("--state <label>", "route or component state label", "default")
    .option("--route <label>", "stable route label when fixture URLs differ")
    .option(
      "--ready-selector <selector>",
      "wait for a visible selector before scanning; required to verify labeled dynamic states"
    )
    .option("--viewport <size>", "viewport as WIDTHxHEIGHT", parseViewport, {
      width: 1280,
      height: 720
    })
    .option("--tags <tags>", "comma-separated axe tags", parseTags, [
      "wcag2a",
      "wcag2aa",
      "wcag21a",
      "wcag21aa",
      "wcag22aa"
    ])
    .option(
      "--include <selector>",
      "include selector (repeatable)",
      collect,
      []
    )
    .option(
      "--exclude <selector>",
      "exclude selector (repeatable)",
      collect,
      []
    )
    .option(
      "--storage-state <path>",
      "Playwright storage-state file; contents are never reported"
    )
    .option(
      "--header <header>",
      "request header as Name: value (repeatable; values are never reported)",
      collect,
      []
    )
    .addOption(
      new Option("--fail-on <impact>", "exit 1 at or above impact")
        .choices(["none", "minor", "moderate", "serious", "critical"])
        .default("none")
    )
    .option("--reduced-motion", "emulate reduced motion", true)
    .option("--no-reduced-motion", "do not emulate reduced motion")
    .option(
      "--allow-private-network",
      "allow non-loopback private-network targets",
      false
    );
}

function scanOptions(url: string, options: CommonOptions) {
  const headers = parseHeaders(options.header);
  return {
    url,
    stateLabel: options.state,
    ...(options.route ? { routeLabel: options.route } : {}),
    ...(options.readySelector ? { readySelector: options.readySelector } : {}),
    viewport: options.viewport,
    wcagTags: options.tags,
    include: options.include,
    exclude: options.exclude,
    ...(options.storageState ? { storageState: options.storageState } : {}),
    ...(headers ? { headers } : {}),
    reducedMotion: options.reducedMotion,
    allowPrivateNetwork:
      options.allowPrivateNetwork || localTargetWasExplicit(url)
  };
}

const program = new Command();
program
  .name("a11y-agent")
  .description("Find the regression, fix the source, prove the repair.")
  .version("0.1.0")
  .showSuggestionAfterError();

addSharedOptions(
  program.command("scan <url>").description("scan a rendered page")
)
  .option("--baseline <report>", "compare the scan with a baseline report")
  .action(
    async (url: string, options: CommonOptions & { baseline?: string }) => {
      const after = await scanPage(scanOptions(url, options));
      const report = options.baseline
        ? compareReports(
            auditReportSchema.parse(await readJson(options.baseline)),
            after
          )
        : after;
      await emit(report, options);
      const candidates =
        report.reportType === "comparison" ? report.new : report.findings;
      if (findingsAtOrAbove(candidates, options.failOn).length > 0)
        process.exitCode = 1;
    }
  );

addSharedOptions(
  program
    .command("scan-html <file>")
    .description("scan a static HTML file with network requests blocked")
).action(async (file: string, options: CommonOptions) => {
  const path = resolve(file);
  const html = await readFile(path, "utf8");
  const report = await scanHtml({
    html,
    fileLabel: relative(process.cwd(), path) || "inline.html",
    stateLabel: options.state,
    viewport: options.viewport,
    wcagTags: options.tags,
    include: options.include,
    exclude: options.exclude,
    reducedMotion: options.reducedMotion
  });
  await emit(report, options);
  if (findingsAtOrAbove(report.findings, options.failOn).length > 0)
    process.exitCode = 1;
});

program
  .command("compare <before> <after>")
  .description(
    "compare two audit reports without suppressing baseline findings"
  )
  .option("-o, --output <path>")
  .addOption(
    new Option("-f, --format <format>")
      .choices(["json", "markdown", "sarif"])
      .default("json")
  )
  .addOption(
    new Option("--fail-on <impact>")
      .choices(["none", "minor", "moderate", "serious", "critical"])
      .default("none")
  )
  .action(
    async (
      beforePath: string,
      afterPath: string,
      options: { output?: string; format: Format; failOn: FailureThreshold }
    ) => {
      const before = auditReportSchema.parse(await readJson(beforePath));
      const after = auditReportSchema.parse(await readJson(afterPath));
      const report = comparisonReportSchema.parse(
        compareReports(before, after)
      );
      await emit(report, options);
      if (findingsAtOrAbove(report.new, options.failOn).length > 0)
        process.exitCode = 1;
    }
  );

addSharedOptions(
  program
    .command("verify <url>")
    .description("replay a scan and verify a repair")
)
  .requiredOption("--baseline <report>", "baseline audit report")
  .option(
    "--fingerprint <fingerprint>",
    "target fingerprint (repeatable)",
    collect,
    []
  )
  .action(
    async (
      url: string,
      options: CommonOptions & { baseline: string; fingerprint: string[] }
    ) => {
      const baseline = auditReportSchema.parse(
        await readJson(options.baseline)
      );
      const report = verificationReportSchema.parse(
        await verifyRepair({
          ...scanOptions(url, options),
          baseline,
          ...(options.fingerprint.length > 0
            ? { targetFingerprints: options.fingerprint }
            : {})
        })
      );
      await emit(report, options);
      if (report.status !== "verified") process.exitCode = 1;
    }
  );

addSharedOptions(
  program
    .command("keyboard <url>")
    .description("run a bounded keyboard journey")
)
  .requiredOption("--journey <path>", "journey JSON file")
  .action(async (url: string, options: CommonOptions & { journey: string }) => {
    const journey = keyboardJourneySchema.parse(
      await readJson(options.journey)
    );
    const headers = parseHeaders(options.header);
    const report = journeyReportSchema.parse(
      await runKeyboardJourney({
        url,
        journey,
        viewport: options.viewport,
        ...(options.storageState ? { storageState: options.storageState } : {}),
        ...(headers ? { headers } : {}),
        reducedMotion: options.reducedMotion,
        allowPrivateNetwork:
          options.allowPrivateNetwork || localTargetWasExplicit(url)
      })
    );
    await emit(report, options);
    if (!report.passed) process.exitCode = 1;
  });

program
  .command("doctor")
  .description("check the local runtime without reading credentials")
  .option("-o, --output <path>")
  .addOption(
    new Option("-f, --format <format>")
      .choices(["json", "markdown"])
      .default("json")
  )
  .action(async (options: { output?: string; format: "json" | "markdown" }) => {
    const major = Number(process.versions.node.split(".")[0]);
    const result = {
      ok: major >= 20,
      node: process.versions.node,
      platform: process.platform,
      checks: [{ name: "Node.js >=20", passed: major >= 20 }],
      note: "Browser availability is verified by the first scan. No environment variables or credentials were read."
    };
    const text =
      options.format === "markdown"
        ? `# a11y-agent doctor\n\n- Node.js: ${result.node}\n- Runtime check: ${result.ok ? "passed" : "failed"}\n\n${result.note}\n`
        : `${JSON.stringify(result, null, 2)}\n`;
    if (options.output) {
      const path = resolve(options.output);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, text, { encoding: "utf8", mode: 0o600 });
    } else process.stdout.write(text);
    if (!result.ok) process.exitCode = 1;
  });

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Command failed.";
  process.stderr.write(
    `a11y-agent: ${message.replace(/\b(Bearer|Basic)\s+\S+/gi, "$1 [REDACTED]")}\n`
  );
  process.exitCode = 2;
});
