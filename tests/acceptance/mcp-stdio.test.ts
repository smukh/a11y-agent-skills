import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  auditReportSchema,
  comparisonReportSchema,
  journeyReportSchema,
  keyboardJourneySchema,
  verificationReportSchema
} from "../../packages/core/src/index.js";
import { startFixtureServer } from "../helpers/fixture-server.js";

let fixtureServer: Awaited<ReturnType<typeof startFixtureServer>> | undefined;
let client: Client | undefined;
let transport: StdioClientTransport | undefined;
let serverStderr = "";

function inheritedEnvironment(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  );
}

function errorTextFromResponse(value: unknown): string {
  if (typeof value !== "object" || value === null) return "Unknown MCP error";
  const content = (value as Record<string, unknown>).content;
  if (!Array.isArray(content)) return "Unknown MCP error";

  const messages = content.flatMap((item): string[] => {
    if (typeof item !== "object" || item === null) return [];
    const record = item as Record<string, unknown>;
    return record.type === "text" && typeof record.text === "string"
      ? [record.text]
      : [];
  });

  return messages.join("\n") || "Unknown MCP error";
}

async function call(name: string, args: Record<string, unknown>) {
  if (!client) throw new Error("MCP client did not start.");
  const response = await client.callTool({ name, arguments: args }, undefined, {
    timeout: 45_000,
    maxTotalTimeout: 45_000
  });
  if (response.isError) {
    throw new Error(
      `${name} returned an MCP error: ${errorTextFromResponse(response)}`
    );
  }
  return (response.structuredContent as { result: unknown }).result;
}

beforeAll(async () => {
  fixtureServer = await startFixtureServer();
  const serverEntry = process.env.A11Y_AGENT_MCP_ENTRY
    ? resolve(process.env.A11Y_AGENT_MCP_ENTRY)
    : resolve("packages/mcp/bundle/index.cjs");
  transport = new StdioClientTransport({
    command: process.env.A11Y_AGENT_RUNTIME ?? process.execPath,
    args: [serverEntry],
    cwd: process.cwd(),
    env: {
      ...inheritedEnvironment(),
      A11Y_AGENT_ALLOW_PRIVATE_NETWORK: "true"
    },
    stderr: "pipe"
  });
  transport.stderr?.on("data", (chunk: Buffer | string) => {
    serverStderr += chunk.toString();
  });
  client = new Client({ name: "stdio-acceptance", version: "1.0.0" });
  try {
    await client.connect(transport);
  } catch (error) {
    throw new Error(
      `MCP stdio handshake failed: ${error instanceof Error ? error.message : "unknown error"}${serverStderr ? `\n${serverStderr.slice(-4_000)}` : ""}`
    );
  }
});

afterAll(async () => {
  await client?.close();
  await transport?.close();
  await fixtureServer?.close();
});

describe("MCP stdio acceptance", () => {
  it("starts the selected MCP entry and exercises all six tools", async () => {
    if (!fixtureServer) throw new Error("Fixture server did not start.");
    if (!client) throw new Error("MCP client did not start.");

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name).sort()).toEqual(
      [
        "compare_reports",
        "get_rule_help",
        "run_keyboard_journey",
        "scan_html",
        "scan_page",
        "verify_repair"
      ].sort()
    );

    const scanArguments = {
      stateLabel: "gallery",
      routeLabel: "/gallery",
      readySelector: "body"
    };
    const before = auditReportSchema.parse(
      await call("scan_page", {
        url: `${fixtureServer.origin}/gallery-broken.html`,
        ...scanArguments
      })
    );
    const after = auditReportSchema.parse(
      await call("scan_page", {
        url: `${fixtureServer.origin}/gallery-repaired.html`,
        ...scanArguments
      })
    );
    expect(before.findings.length).toBeGreaterThan(0);
    expect(after.findings).toHaveLength(0);

    const staticReport = auditReportSchema.parse(
      await call("scan_html", {
        html: '<!doctype html><html lang="en"><head><title>Fixture</title></head><body><main><img src="product.png"></main></body></html>',
        fileLabel: "inline-fixture.html"
      })
    );
    expect(
      staticReport.findings.some((finding) => finding.ruleId === "image-alt")
    ).toBe(true);

    const comparison = comparisonReportSchema.parse(
      await call("compare_reports", { before, after })
    );
    expect(comparison.resolved.length).toBeGreaterThan(0);

    const verification = verificationReportSchema.parse(
      await call("verify_repair", {
        url: `${fixtureServer.origin}/gallery-repaired.html`,
        baseline: before,
        ...scanArguments
      })
    );
    expect(verification.status).toBe("verified");

    const journey = keyboardJourneySchema.parse(
      JSON.parse(
        await readFile(
          resolve("fixtures/static/journeys/dialog-close-restore.json"),
          "utf8"
        )
      ) as unknown
    );
    const journeyReport = journeyReportSchema.parse(
      await call("run_keyboard_journey", {
        url: `${fixtureServer.origin}/gallery-repaired.html`,
        journey
      })
    );
    expect(journeyReport.passed).toBe(true);

    const help = (await call("get_rule_help", {
      ruleId: "image-alt"
    })) as { ruleId: string; source: string };
    expect(help).toMatchObject({ ruleId: "image-alt", source: "axe-core" });
  }, 120_000);
});
