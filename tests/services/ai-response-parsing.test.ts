import { describe, expect, it } from "vitest";
import {
  parseCommitCandidates,
  parseCommitMessageResponse,
} from "../../src/prompts/commit.prompt.js";
import { parseExplainResponse } from "../../src/prompts/explain.prompt.js";
import { AppError } from "../../src/utils/errors.js";

describe("AI response parsing", () => {
  it("parses JSON with exactly 3 commit candidates", () => {
    const raw = JSON.stringify({
      commits: [
        "feat(auth): add refresh token authentication",
        "feat(auth): implement refresh token support",
        "refactor(auth): improve token authentication",
      ],
    });

    expect(parseCommitCandidates(raw)).toEqual([
      "feat(auth): add refresh token authentication",
      "feat(auth): implement refresh token support",
      "refactor(auth): improve token authentication",
    ]);
  });

  it("parses JSON wrapped in markdown fences", () => {
    const raw = `\`\`\`json
{
  "commits": [
    "feat(api): add rate limiting",
    "feat(api): introduce request rate limits",
    "fix(api): prevent request flooding"
  ]
}
\`\`\``;

    expect(parseCommitCandidates(raw)).toHaveLength(3);
    expect(parseCommitCandidates(raw)[0]).toBe("feat(api): add rate limiting");
  });

  it("falls back to conventional commit lines when JSON is missing", () => {
    const raw = `
Here are options:
feat(core): introduce caching layer
feat(core): add in-memory cache
perf(core): speed up lookups with cache
`;
    expect(parseCommitCandidates(raw)).toEqual([
      "feat(core): introduce caching layer",
      "feat(core): add in-memory cache",
      "perf(core): speed up lookups with cache",
    ]);
  });

  it("throws on empty AI response", () => {
    expect(() => parseCommitCandidates("   ")).toThrow(AppError);
  });

  it("throws when fewer than 3 candidates are returned", () => {
    const raw = JSON.stringify({
      commits: ["feat(api): add endpoint"],
    });
    expect(() => parseCommitCandidates(raw)).toThrow(AppError);
    expect(() => parseCommitCandidates(raw)).toThrow(/expected 3/i);
  });

  it("throws on malformed JSON without recoverable candidates", () => {
    expect(() => parseCommitCandidates("{not-json")).toThrow(AppError);
  });

  it("ignores empty strings inside commits array", () => {
    const raw = JSON.stringify({
      commits: [
        "feat(ui): add dark mode toggle",
        "",
        "feat(ui): enable dark theme",
        "style(ui): polish dark mode styles",
      ],
    });
    expect(parseCommitCandidates(raw)).toEqual([
      "feat(ui): add dark mode toggle",
      "feat(ui): enable dark theme",
      "style(ui): polish dark mode styles",
    ]);
  });

  it("keeps backward-compatible single-message parsing", () => {
    expect(
      parseCommitMessageResponse("feat(auth): add refresh token authentication"),
    ).toBe("feat(auth): add refresh token authentication");
  });

  it("strips markdown fences for single-message fallback", () => {
    const raw = "```\nfeat(api): add rate limiting\n```";
    // Not enough candidates for multi-parse; single-message fallback still works
    expect(parseCommitMessageResponse(raw)).toBe("feat(api): add rate limiting");
  });

  it("parses explain responses and strips fences", () => {
    const raw = "```\nThis commit adds caching.\n```";
    expect(parseExplainResponse(raw)).toBe("This commit adds caching.");
  });
});
