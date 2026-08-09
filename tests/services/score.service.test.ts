import { describe, expect, it } from "vitest";
import { ScoreService } from "../../src/services/score.service.js";

describe("ScoreService", () => {
  const scorer = new ScoreService();

  it("scores a strong conventional commit highly", () => {
    const result = scorer.score(
      "feat(auth): add refresh token authentication",
    );

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.maxScore).toBe(100);
    expect(result.items.some((i) => i.label === "Valid Conventional Commit" && i.passed)).toBe(
      true,
    );
    expect(result.items.some((i) => i.label === "Clear description" && i.passed)).toBe(
      true,
    );
  });

  it("scores a vague non-conventional message poorly", () => {
    const result = scorer.score("update stuff");

    expect(result.score).toBeLessThanOrEqual(30);
    expect(
      result.items.some(
        (i) => i.label === "Valid Conventional Commit" && !i.passed,
      ),
    ).toBe(true);
  });

  it("rewards action verbs and scopes", () => {
    const withScope = scorer.score("fix(api): resolve request timeout");
    const withoutScope = scorer.score("fix: resolve request timeout");

    expect(withScope.score).toBeGreaterThan(withoutScope.score);
  });
});
