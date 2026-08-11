import { describe, expect, it, vi, beforeEach } from "vitest";
import { ExplainService } from "../../src/services/explain.service.js";
import { AppError } from "../../src/utils/errors.js";
import type { CommitDetails, CommitInfo } from "../../src/types/git.types.js";

const mockGenerate = vi.fn();
const mockEnsureRepository = vi.fn();
const mockGetRecentCommits = vi.fn();
const mockGetCommitDetails = vi.fn();

vi.mock("../../src/services/ai.service.js", () => ({
  AIService: class {
    generate = mockGenerate;
  },
}));

vi.mock("../../src/services/git.service.js", () => ({
  GitService: class {
    ensureRepository = mockEnsureRepository;
    getRecentCommits = mockGetRecentCommits;
    getCommitDetails = mockGetCommitDetails;
  },
}));

const sampleCommit: CommitInfo = {
  hash: "a83f91d0123456789abcdef",
  shortHash: "a83f91d",
  message: "feat(auth): add refresh token support",
  author: "Bemnet",
  date: "2026-08-11 12:00:00 +0300",
  body: "",
};

const sampleDetails: CommitDetails = {
  commit: sampleCommit,
  diff: "diff --git a/src/auth/service.ts b/src/auth/service.ts\n+export const x = 1;\n",
  files: [{ path: "src/auth/service.ts", status: "M" }],
  stats: { filesChanged: 1, insertions: 1, deletions: 0 },
  diffTruncated: false,
};

describe("ExplainService", () => {
  beforeEach(() => {
    mockGenerate.mockReset();
    mockEnsureRepository.mockReset();
    mockGetRecentCommits.mockReset();
    mockGetCommitDetails.mockReset();
    mockEnsureRepository.mockResolvedValue(undefined);
    mockGetCommitDetails.mockResolvedValue(sampleDetails);
  });

  it("explains a commit using Git details and AI", async () => {
    mockGenerate.mockResolvedValue({
      text: "This commit adds refresh token support to authentication.",
      model: "test",
    });

    const service = new ExplainService();
    const result = await service.explainCommit("a83f91d");

    expect(mockGetCommitDetails).toHaveBeenCalledWith("a83f91d");
    expect(result.details.commit.shortHash).toBe("a83f91d");
    expect(result.explanation).toContain("refresh token");
  });

  it("throws when there are no commits to select", async () => {
    mockGetRecentCommits.mockResolvedValue([]);
    const service = new ExplainService();
    await expect(service.getRecentCommits()).rejects.toBeInstanceOf(AppError);
    await expect(service.getRecentCommits()).rejects.toMatchObject({
      code: "NO_COMMITS",
    });
  });

  it("propagates commit-not-found errors", async () => {
    mockGetCommitDetails.mockRejectedValue(
      new AppError("Commit not found: deadbeef", "COMMIT_NOT_FOUND"),
    );
    const service = new ExplainService();
    await expect(service.explainCommit("deadbeef")).rejects.toMatchObject({
      code: "COMMIT_NOT_FOUND",
      message: "Commit not found: deadbeef",
    });
  });
});
