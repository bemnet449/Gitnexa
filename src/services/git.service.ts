import path from "node:path";
import { simpleGit, type SimpleGit, type StatusResult } from "simple-git";
import { AppError } from "../utils/errors.js";
import type {
  CommitChangeFile,
  CommitDetails,
  CommitInfo,
  DiffStats,
  RepoInfo,
  StagedAnalysis,
  StagedFile,
} from "../types/git.types.js";

export class GitService {
  private readonly git: SimpleGit;
  private readonly cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
    this.git = simpleGit({ baseDir: cwd });
  }

  async ensureGitInstalled(): Promise<void> {
    try {
      await this.git.raw(["--version"]);
    } catch {
      throw new AppError(
        "Git is not installed or not available in PATH.",
        "GIT_NOT_INSTALLED",
      );
    }
  }

  async isRepository(): Promise<boolean> {
    try {
      return await this.git.checkIsRepo();
    } catch {
      return false;
    }
  }

  async ensureRepository(): Promise<void> {
    await this.ensureGitInstalled();
    const isRepo = await this.isRepository();
    if (!isRepo) {
      throw new AppError(
        "This directory is not a Git repository.",
        "NOT_A_REPO",
      );
    }
  }

  async getRepoInfo(): Promise<RepoInfo> {
    await this.ensureRepository();

    const root = path.resolve(
      (await this.git.revparse(["--show-toplevel"])).trim(),
    );
    const status = await this.git.status();
    let branch = status.current?.trim() || "";

    if (!branch) {
      try {
        branch = (await this.git.revparse(["--abbrev-ref", "HEAD"])).trim();
      } catch {
        branch = "(no commits yet)";
      }
    }

    if (!branch || branch === "HEAD") {
      branch = "(detached HEAD)";
    }

    return {
      root,
      name: path.basename(root),
      branch,
      isClean: status.isClean(),
    };
  }

  async getStatus(): Promise<StatusResult> {
    await this.ensureRepository();
    return this.git.status();
  }

  async getStagedFiles(): Promise<StagedFile[]> {
    const status = await this.getStatus();
    const files: StagedFile[] = [];

    for (const file of status.files) {
      // Index status is non-space when staged (A, M, D, R, C, etc.)
      if (file.index !== " " && file.index !== "?") {
        files.push({
          path: file.path,
          indexStatus: file.index,
          workingTreeStatus: file.working_dir,
        });
      }
    }

    return files;
  }

  async getStagedDiff(): Promise<string> {
    await this.ensureRepository();
    return this.git.diff(["--cached"]);
  }

  async getDiffStats(): Promise<DiffStats> {
    await this.ensureRepository();
    const summary = await this.git.diffSummary(["--cached"]);

    return {
      filesChanged: summary.files.length,
      insertions: summary.insertions,
      deletions: summary.deletions,
    };
  }

  /**
   * Build a lightweight human-readable summary from the staged diff
   * without inventing changes that aren't present.
   */
  buildSummaryLines(diff: string, files: StagedFile[]): string[] {
    const lines: string[] = [];

    if (files.length === 0) {
      return lines;
    }

    const addedHunks = (diff.match(/^\+[^+]/gm) ?? []).length;
    const removedHunks = (diff.match(/^-[^-]/gm) ?? []).length;

    if (addedHunks > 0) {
      lines.push(`+ ${addedHunks} added line(s) across staged files`);
    }
    if (removedHunks > 0) {
      lines.push(`- ${removedHunks} removed line(s) across staged files`);
    }

    const byStatus = new Map<string, string[]>();
    for (const file of files) {
      const list = byStatus.get(file.indexStatus) ?? [];
      list.push(file.path);
      byStatus.set(file.indexStatus, list);
    }

    const labels: Record<string, string> = {
      A: "Added",
      M: "Modified",
      D: "Deleted",
      R: "Renamed",
      C: "Copied",
    };

    for (const [status, paths] of byStatus) {
      const label = labels[status] ?? `Status ${status}`;
      lines.push(`${label}: ${paths.join(", ")}`);
    }

    return lines;
  }

  async analyzeStagedChanges(): Promise<StagedAnalysis> {
    const repo = await this.getRepoInfo();
    const files = await this.getStagedFiles();
    const diff = await this.getStagedDiff();
    const stats = await this.getDiffStats();
    const summaryLines = this.buildSummaryLines(diff, files);

    return { repo, files, diff, stats, summaryLines };
  }

  async hasStagedChanges(): Promise<boolean> {
    const files = await this.getStagedFiles();
    return files.length > 0;
  }

  async createCommit(message: string): Promise<string> {
    await this.ensureRepository();

    const trimmed = message.trim();
    if (!trimmed) {
      throw new AppError("Commit message cannot be empty.", "EMPTY_MESSAGE");
    }

    const hasStaged = await this.hasStagedChanges();
    if (!hasStaged) {
      throw new AppError(
        "No staged changes to commit. Stage files with `git add` first.",
        "NO_STAGED_CHANGES",
      );
    }

    try {
      const result = await this.git.commit(trimmed);
      return result.commit;
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Unknown git error";
      throw new AppError(
        `Failed to create Git commit: ${detail}`,
        "COMMIT_FAILED",
      );
    }
  }

  async getRecentCommits(limit = 10): Promise<CommitInfo[]> {
    await this.ensureRepository();

    const safeLimit = Math.max(1, Math.min(limit, 100));

    try {
      const log = await this.git.log({
        maxCount: safeLimit,
        format: {
          hash: "%H",
          date: "%ci",
          message: "%s",
          author_name: "%an",
          body: "%b",
        },
      });

      return log.all.map((entry) => ({
        hash: entry.hash,
        shortHash: entry.hash.slice(0, 7),
        message: entry.message,
        author: entry.author_name,
        date: entry.date,
        body: entry.body?.trim() ?? "",
      }));
    } catch {
      return [];
    }
  }

  async getCommit(ref: string): Promise<CommitInfo> {
    await this.ensureRepository();

    try {
      const raw = await this.git.raw([
        "show",
        "-s",
        "--format=%H%n%an%n%ci%n%s%n%b",
        ref,
      ]);

      const parts = raw.trim().split("\n");
      const hash = parts[0] ?? "";
      const author = parts[1] ?? "";
      const date = parts[2] ?? "";
      const message = parts[3] ?? "";
      const body = parts.slice(4).join("\n").trim();

      if (!hash) {
        throw new Error("empty");
      }

      return {
        hash,
        shortHash: hash.slice(0, 7),
        message,
        author,
        date,
        body,
      };
    } catch {
      throw new AppError(`Commit not found: ${ref}`, "COMMIT_NOT_FOUND");
    }
  }

  async getCommitDiff(ref: string): Promise<string> {
    await this.ensureRepository();
    try {
      // Patch only — omit commit metadata for cleaner AI context.
      return await this.git.show(["--format=", "--patch", ref]);
    } catch {
      throw new AppError(
        `Could not read diff for commit: ${ref}`,
        "COMMIT_DIFF_FAILED",
      );
    }
  }

  async getCommitChangedFiles(ref: string): Promise<CommitChangeFile[]> {
    await this.ensureRepository();
    try {
      const raw = await this.git.raw([
        "diff-tree",
        "--no-commit-id",
        "--name-status",
        "-r",
        "--root",
        ref,
      ]);

      return raw
        .trim()
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [status = "M", ...pathParts] = line.split(/\s+/);
          const path = pathParts.join(" ").trim();
          return { status, path };
        })
        .filter((file) => file.path.length > 0);
    } catch {
      return [];
    }
  }

  async getCommitStats(ref: string): Promise<DiffStats> {
    await this.ensureRepository();
    try {
      const raw = await this.git.show(["--format=", "--numstat", ref]);
      let insertions = 0;
      let deletions = 0;
      let filesChanged = 0;

      for (const line of raw.trim().split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const [added = "0", removed = "0"] = trimmed.split(/\t/);
        // Binary files show "-" for counts.
        if (added !== "-") {
          insertions += Number.parseInt(added, 10) || 0;
        }
        if (removed !== "-") {
          deletions += Number.parseInt(removed, 10) || 0;
        }
        filesChanged += 1;
      }

      return { filesChanged, insertions, deletions };
    } catch {
      return { filesChanged: 0, insertions: 0, deletions: 0 };
    }
  }

  async getCommitDetails(ref: string): Promise<CommitDetails> {
    const commit = await this.getCommit(ref);
    const [diff, files, stats] = await Promise.all([
      this.getCommitDiff(commit.hash),
      this.getCommitChangedFiles(commit.hash),
      this.getCommitStats(commit.hash),
    ]);

    return {
      commit,
      diff,
      files,
      stats,
      diffTruncated: false,
    };
  }
}
