import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface SpecialistCase {
  id: string;
  skill: string;
  deterministicRulesExpected: string[];
  behaviorAssertionsExpected: string[];
  manualReviewItems: string[];
  allowedFixes: string[];
  prohibitedFixes: string[];
  fixture: { broken: string; repaired: string; selector: string };
}

describe("specialist evaluation packaging", () => {
  it("ships runnable fixture sources and evaluation coverage for every specialist prompt", async () => {
    const catalog = JSON.parse(
      await readFile(resolve("evals/cases/catalog.json"), "utf8")
    ) as {
      fixtureRevision: string;
      cases: SpecialistCase[];
      negativeControls: Array<{ id: string; fixture: string }>;
    };
    const prompts = JSON.parse(
      await readFile(resolve("evals/prompts/specialists.json"), "utf8")
    ) as {
      fixtureRevision: string;
      prompts: Array<{
        caseId: string;
        skill: string;
        entryUrl: string;
        negativeControlPrompt: string;
      }>;
    };
    expect(prompts.fixtureRevision).toBe(catalog.fixtureRevision);
    expect(new Set(prompts.prompts.map((prompt) => prompt.skill)).size).toBe(5);
    for (const prompt of prompts.prompts) {
      const entry = catalog.cases.find((item) => item.id === prompt.caseId);
      expect(entry).toBeDefined();
      if (!entry) throw new Error(`Missing case ${prompt.caseId}`);
      expect(prompt.skill).toBe(entry.skill);
      expect(prompt.entryUrl).toBe(`/${entry.fixture.broken}`);
      expect(entry.behaviorAssertionsExpected.length).toBeGreaterThan(0);
      expect(entry.manualReviewItems.length).toBeGreaterThan(0);
      expect(entry.allowedFixes.length).toBeGreaterThan(0);
      expect(entry.prohibitedFixes.length).toBeGreaterThan(0);
      expect(entry.deterministicRulesExpected).toEqual([]);
      await stat(resolve("skills", entry.skill, "SKILL.md"));
      for (const file of [entry.fixture.broken, entry.fixture.repaired]) {
        const html = await readFile(resolve("fixtures/static", file), "utf8");
        for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
          await stat(resolve("fixtures/static", file, "..", match[1]!));
        }
      }
      const negative = catalog.negativeControls.find(
        (item) => item.id === `${entry.id}-negative`
      );
      expect(negative).toBeDefined();
      if (negative) await stat(resolve("fixtures/static", negative.fixture));
    }
  });
});
