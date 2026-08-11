import { describe, expect, it, vi, beforeEach } from "vitest";
import { CommitService } from "../../src/services/commit.service.js";
import type { StagedAnalysis } from "../../src/types/git.types.js";

const mockGenerate = vi.fn();
const mockAnalyzeStagedChanges = vi.fn();
const mockCreateCommit = vi.fn();

vi.mock("../../src/services/ai.service.js", () => ({
  AIService: class {
    generate = mockGenerate;
  },
}));

vi.mock("../../src/services/git.service.js", () => ({
  GitService: class {
    analyzeStagedChanges = mockAnalyzeStagedChanges;
    createCommit = mockCreateCommit;
  },
}));

const sampleAnalysis: StagedAnalysis = {
  repo: {
    root: "/tmp/repo",
    name: "repo",
    branch: "main",
    isClean: false,
  },
  files: [
    { path: "src/auth.ts", indexStatus: "A", workingTreeStatus: " " },
  ],
  diff: "+export function login() {}",
  stats: { filesChanged: 1, insertions: 1, deletions: 0 },
  summaryLines: ["Added: src/auth.ts"],
};

describe("CommitService candidate generation", () => {
  beforeEach(() => {
    mockGenerate.mockReset();
    mockAnalyzeStagedChanges.mockReset();
    mockCreateCommit.mockReset();
    mockAnalyzeStagedChanges.mockResolvedValue(sampleAnalysis);
  });

  it("returns 3 locally validated and scored candidates", async () => {
    mockGenerate.mockResolvedValue({
      text: JSON.stringify({
        commits: [
          "feat(auth): add refresh token authentication",
          "feat(auth): implement refresh token support",
          "refactor(auth): improve token authentication",
        ],
      }),
      model: "test",
    });

    const service = new CommitService();
    const candidates = await service.generateCommitCandidates(sampleAnalysis);

    expect(candidates).toHaveLength(3);
    expect(candidates[0]?.message).toBe(
      "feat(auth): add refresh token authentication",
    );
    expect(candidates[0]?.validation.type).toBe("feat");
    expect(candidates[0]?.validation.scope).toBe("auth");
    expect(candidates[0]?.score.score).toBeGreaterThan(0);
    expect(candidates[1]?.score.score).toBeGreaterThan(0);
    expect(candidates[2]?.validation.type).toBe("refactor");
  });

  it("rejects malformed AI responses", async () => {
    mockGenerate.mockResolvedValue({
      text: "sorry, I cannot help",
      model: "test",
    });

    const service = new CommitService();
    await expect(
      service.generateCommitCandidates(sampleAnalysis),
    ).rejects.toMatchObject({ code: "INVALID_AI_RESPONSE" });
  });

  it("commits only the selected candidate message", async () => {
    mockCreateCommit.mockResolvedValue("abc123");
    const service = new CommitService();
    const selected =
      "feat(auth): implement refresh token support";

    await service.createCommit(selected);

    expect(mockCreateCommit).toHaveBeenCalledTimes(1);
    expect(mockCreateCommit).toHaveBeenCalledWith(selected);
    expect(mockCreateCommit).not.toHaveBeenCalledWith(
      "feat(auth): add refresh token authentication",
    );
  });

  it("enrichMessage scores and validates a selected candidate", () => {
    const service = new CommitService();
    const result = service.enrichMessage(
      "feat(auth): add refresh token authentication",
    );

    expect(result.validation.valid).toBe(true);
    expect(result.validation.type).toBe("feat");
    expect(result.score.score).toBeGreaterThanOrEqual(90);
  });
});
