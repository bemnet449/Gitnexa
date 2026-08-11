import { describe, expect, it } from "vitest";
import {
  formatRelativeTime,
  extractAffectedAreas,
  formatSelectedCommitPanel,
} from "../../src/utils/formatter.js";
import { renderPanel, renderKeyValuePanel } from "../../src/utils/ui/panel.js";
import { renderAppHeader } from "../../src/utils/ui/header.js";
import type { CommitCandidate } from "../../src/types/commit.types.js";

describe("UI helpers", () => {
  it("renders panels with borders", () => {
    const panel = renderPanel("GitSense", ["hello"]);
    expect(panel).toContain("╭");
    expect(panel).toContain("GitSense");
    expect(panel).toContain("hello");
    expect(panel).toContain("╰");
  });

  it("renders key/value panels", () => {
    const panel = renderKeyValuePanel("Repo", [
      { key: "Branch", value: "main" },
    ]);
    expect(panel).toContain("Branch");
    expect(panel).toContain("main");
  });

  it("renders app header", () => {
    const header = renderAppHeader();
    expect(header).toContain("GitSense");
    expect(header).toContain("AI-powered Git assistant");
  });

  it("formats relative time", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoHoursAgo)).toMatch(/hour/);
  });

  it("extracts affected areas from a diff", () => {
    const diff = `diff --git a/src/auth/service.ts b/src/auth/service.ts
--- a/src/auth/service.ts
+++ b/src/auth/service.ts
+export const x = 1;
`;
    expect(extractAffectedAreas(diff)).toContain("src/");
  });

  it("formats selected commit panel with score and validation", () => {
    const candidate: CommitCandidate = {
      index: 0,
      message: "feat(auth): add refresh token authentication",
      validation: {
        valid: true,
        type: "feat",
        scope: "auth",
        description: "add refresh token authentication",
        reasons: [],
      },
      score: {
        score: 95,
        maxScore: 100,
        items: [
          { label: "Valid Conventional Commit", passed: true, points: 30 },
          { label: "Clear description", passed: true, points: 20 },
        ],
      },
    };

    const panel = formatSelectedCommitPanel(candidate);
    expect(panel).toContain("Selected Commit");
    expect(panel).toContain("feat(auth): add refresh token authentication");
    expect(panel).toContain("95/100");
    expect(panel).toContain("feat");
    expect(panel).toContain("auth");
  });
});
