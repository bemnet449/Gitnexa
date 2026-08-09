import { describe, expect, it } from "vitest";
import { validateConventionalCommit } from "../../src/validators/conventional-commit.validator.js";

describe("validateConventionalCommit", () => {
  it("accepts a valid conventional commit with scope", () => {
    const result = validateConventionalCommit(
      "feat(auth): add refresh token authentication",
    );

    expect(result.valid).toBe(true);
    expect(result.type).toBe("feat");
    expect(result.scope).toBe("auth");
    expect(result.description).toBe("add refresh token authentication");
    expect(result.reasons).toEqual([]);
  });

  it("accepts a valid commit without scope", () => {
    const result = validateConventionalCommit("fix: resolve timeout on login");

    expect(result.valid).toBe(true);
    expect(result.type).toBe("fix");
    expect(result.scope).toBeNull();
    expect(result.description).toBe("resolve timeout on login");
  });

  it("rejects empty messages", () => {
    const result = validateConventionalCommit("   ");
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("Commit message is empty");
  });

  it("rejects missing conventional structure", () => {
    const result = validateConventionalCommit("update stuff");
    expect(result.valid).toBe(false);
    expect(result.type).toBeNull();
    expect(result.reasons.some((r) => r.includes("Missing Conventional Commit"))).toBe(
      true,
    );
  });

  it("rejects invalid types", () => {
    const result = validateConventionalCommit("banana(api): do something useful");
    expect(result.valid).toBe(false);
    expect(result.type).toBeNull();
    expect(result.reasons.some((r) => r.includes("Invalid commit type"))).toBe(
      true,
    );
  });

  it("rejects trailing punctuation", () => {
    const result = validateConventionalCommit("feat(api): add endpoint.");
    expect(result.valid).toBe(false);
    expect(
      result.reasons.some((r) => r.includes("should not end with punctuation")),
    ).toBe(true);
  });

  it("rejects uppercase description start", () => {
    const result = validateConventionalCommit("feat(api): Add endpoint handler");
    expect(result.valid).toBe(false);
    expect(
      result.reasons.some((r) => r.includes("lowercase letter")),
    ).toBe(true);
  });
});
