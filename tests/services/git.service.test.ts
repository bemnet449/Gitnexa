import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { simpleGit } from "simple-git";
import { afterEach, describe, expect, it } from "vitest";
import { GitService } from "../../src/services/git.service.js";
import { AppError } from "../../src/utils/errors.js";

describe("GitService repository detection", () => {
  const cleanupDirs: string[] = [];

  afterEach(async () => {
    while (cleanupDirs.length > 0) {
      const dir = cleanupDirs.pop();
      if (dir) {
        await rm(dir, { recursive: true, force: true });
      }
    }
  });

  async function createTempDir(): Promise<string> {
    const dir = await mkdtemp(path.join(tmpdir(), "gitsense-"));
    cleanupDirs.push(dir);
    return dir;
  }

  it("detects a non-git directory", async () => {
    const dir = await createTempDir();
    const git = new GitService(dir);

    await expect(git.isRepository()).resolves.toBe(false);
    await expect(git.ensureRepository()).rejects.toBeInstanceOf(AppError);
    await expect(git.ensureRepository()).rejects.toMatchObject({
      code: "NOT_A_REPO",
      message: "This directory is not a Git repository.",
    });
  });

  it("detects a git repository and returns repo info", async () => {
    const dir = await createTempDir();
    const sg = simpleGit(dir);
    await sg.init();
    await sg.addConfig("user.name", "GitSense Test");
    await sg.addConfig("user.email", "test@gitsense.local");

    // Create an initial commit so HEAD exists
    await writeFile(path.join(dir, "README.md"), "# test\n");
    await sg.add("README.md");
    await sg.commit("chore: initial commit");

    const git = new GitService(dir);
    await expect(git.isRepository()).resolves.toBe(true);

    const info = await git.getRepoInfo();
    expect(path.resolve(info.root)).toBe(path.resolve(dir));
    expect(info.name).toBe(path.basename(dir));
    expect(info.branch.length).toBeGreaterThan(0);
  });

  it("analyzes staged changes only", async () => {
    const dir = await createTempDir();
    const sg = simpleGit(dir);
    await sg.init();
    await sg.addConfig("user.name", "GitSense Test");
    await sg.addConfig("user.email", "test@gitsense.local");

    await writeFile(path.join(dir, "README.md"), "# test\n");
    await sg.add("README.md");
    await sg.commit("chore: initial commit");

    await mkdir(path.join(dir, "src"), { recursive: true });
    await writeFile(path.join(dir, "src", "a.ts"), "export const a = 1;\n");
    await writeFile(path.join(dir, "src", "b.ts"), "export const b = 2;\n");
    await sg.add("src/a.ts");

    const git = new GitService(dir);
    const analysis = await git.analyzeStagedChanges();

    expect(analysis.files.map((f) => f.path)).toEqual(["src/a.ts"]);
    expect(analysis.diff).toContain("export const a = 1");
    expect(analysis.diff).not.toContain("export const b = 2");
    expect(analysis.stats.filesChanged).toBe(1);
  });
});
