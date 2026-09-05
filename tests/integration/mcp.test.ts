import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { compareReports } from "../../packages/core/src/index.js";
import { createServer } from "../../packages/mcp/src/index.js";
import { makeFinding, makeReport } from "../helpers/report.js";

const closeCallbacks: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (closeCallbacks.length > 0) await closeCallbacks.pop()?.();
});

describe("MCP adapter", () => {
  it("returns the same comparison as direct core for identical input", async () => {
    const before = makeReport([makeFinding()]);
    const after = makeReport([]);
    const server = createServer();
    const client = new Client({ name: "contract-test", version: "1.0.0" });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    closeCallbacks.push(
      async () => client.close(),
      async () => server.close()
    );
    const response = await client.callTool({
      name: "compare_reports",
      arguments: { before, after }
    });
    expect(response.isError).not.toBe(true);
    const direct = compareReports(before, after);
    const adapted = (response.structuredContent as { result: typeof direct })
      .result;
    expect({
      ...adapted,
      runId: direct.runId,
      timestamp: direct.timestamp
    }).toEqual(direct);
  });

  it("does not expose credential or arbitrary-code inputs", async () => {
    const server = createServer();
    const client = new Client({ name: "contract-test", version: "1.0.0" });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    closeCallbacks.push(
      async () => client.close(),
      async () => server.close()
    );
    const tools = await client.listTools();
    const serializedInputs = JSON.stringify(
      tools.tools.map((tool) => tool.inputSchema)
    );
    expect(serializedInputs).not.toMatch(
      /authorization|cookie|storageState|shellCommand/i
    );
    const rejected = await client.callTool({
      name: "scan_page",
      arguments: {
        url: "https://example.com",
        shellCommand: "echo must-not-run"
      }
    });
    expect(rejected.isError).toBe(true);
  });
});
