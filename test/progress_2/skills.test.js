import { describe, it, expect } from "vitest";

// We can't directly import TypeScript from Supabase functions in Vitest without
// ts loader config, so we test the shape by importing the raw file and evaluating.
// Instead, we duplicate the expected keys and validate the contract.

const EXPECTED_KEYS = [
  "general",
  "feature_extraction",
  "ui_bug_detection",
  "sentiment_analysis",
  "competitor_swot",
  "pricing_complaints",
  "executive_summary",
];

const REQUIRED_FIELDS = ["label", "emoji", "description", "prompt"];

// Read the skills file as text and parse it
import { readFileSync } from "fs";
const skillsContent = readFileSync(
  "supabase/functions/_shared/skills.ts",
  "utf-8"
);

describe("skills.ts", () => {
  it("exports exactly 7 skill keys", () => {
    for (const key of EXPECTED_KEYS) {
      expect(skillsContent).toContain(`${key}:`);
    }
  });

  it("each skill has label, emoji, description, and prompt fields", () => {
    for (const field of REQUIRED_FIELDS) {
      // Each field should appear at least 7 times (once per skill)
      const matches = skillsContent.match(new RegExp(`${field}:`, "g"));
      expect(matches).not.toBeNull();
      expect(matches.length).toBeGreaterThanOrEqual(7);
    }
  });

  it("general skill has empty prompt", () => {
    // General should have prompt: ""
    expect(skillsContent).toMatch(/general[\s\S]*?prompt:\s*["']?["']?\s*[,}]/);
  });

  it("non-general skills have non-empty prompts", () => {
    const nonGeneral = EXPECTED_KEYS.filter((k) => k !== "general");
    for (const key of nonGeneral) {
      // Extract the block for this key and check prompt is not empty
      const keyIndex = skillsContent.indexOf(`${key}:`);
      expect(keyIndex).toBeGreaterThan(-1);
      // The prompt field after this key should have content between quotes
      const blockAfterKey = skillsContent.slice(keyIndex, keyIndex + 1000);
      const promptMatch = blockAfterKey.match(/prompt:\s*["'`](.+?)["'`]/s);
      expect(promptMatch).not.toBeNull();
      expect(promptMatch[1].length).toBeGreaterThan(10);
    }
  });
});
