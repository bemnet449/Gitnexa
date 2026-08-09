import { describe, expect, it } from "vitest";
import { parseCommitMessageResponse } from "../../src/prompts/commit.prompt.js";
import { parseExplainResponse } from "../../src/prompts/explain.prompt.js";

describe("AI response parsing", () => {
  it("returns a plain commit subject", () => {
    expect(
      parseCommitMessageResponse("feat(auth): add refresh token authentication"),
    ).toBe("feat(auth): add refresh token authentication");
  });

  it("strips markdown fences", () => {
    const raw = "```\nfeat(api): add rate limiting\n```";
    expect(parseCommitMessageResponse(raw)).toBe("feat(api): add rate limiting");
  });

  it("strips language-tagged fences and quotes", () => {
    const raw = '```text\n"fix(ui): correct button alignment"\n```';
    expect(parseCommitMessageResponse(raw)).toBe(
      "fix(ui): correct button alignment",
    );
  });

  it("uses only the first non-empty line", () => {
    const raw = `
feat(core): introduce caching layer

This commit adds an in-memory cache.
`;
    expect(parseCommitMessageResponse(raw)).toBe(
      "feat(core): introduce caching layer",
    );
  });

  it("parses explain responses and strips fences", () => {
    const raw = "```\nThis commit adds caching.\n```";
    expect(parseExplainResponse(raw)).toBe("This commit adds caching.");
  });
});
