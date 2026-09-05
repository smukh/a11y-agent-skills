import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  keyboardJourneySchema,
  runKeyboardJourney,
  type KeyboardJourney
} from "../../packages/core/src/index.js";
import { startFixtureServer } from "../helpers/fixture-server.js";

let server: Awaited<ReturnType<typeof startFixtureServer>> | undefined;
beforeAll(async () => {
  server = await startFixtureServer();
});
afterAll(async () => server?.close());

async function journey(name: string): Promise<KeyboardJourney> {
  return keyboardJourneySchema.parse(
    JSON.parse(
      await readFile(
        resolve("fixtures/static/journeys", `${name}.json`),
        "utf8"
      )
    ) as unknown
  );
}

async function run(page: "broken" | "repaired", journeyName: string) {
  if (!server) throw new Error("Fixture server did not start.");
  return runKeyboardJourney({
    url: `${server.origin}/gallery-${page}.html`,
    journey: await journey(journeyName),
    allowPrivateNetwork: true
  });
}

describe("keyboard journey fixtures", () => {
  it.each([
    "dialog-trap",
    "dialog-close-restore",
    "invalid-form",
    "menu-keyboard",
    "skip-link"
  ])("%s fails broken behavior and passes repaired behavior", async (name) => {
    expect((await run("broken", name)).passed).toBe(false);
    expect((await run("repaired", name)).passed).toBe(true);
  });
});
