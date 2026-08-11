import type { Command } from "commander";
import { CommitService } from "../services/commit.service.js";
import {
  formatCommitSummaryPanel,
  formatSelectedCommitPanel,
} from "../utils/formatter.js";
import {
  confirmAction,
  printAppHeader,
  selectOption,
  status,
  withSpinner,
} from "../utils/ui/index.js";
import {
  getErrorMessage,
  isAppError,
  sanitizeErrorMessage,
} from "../utils/errors.js";
import type { CommitCandidate } from "../types/commit.types.js";

export function commitCommand(program: Command): void {
  program
    .command("commit")
    .description("Generate AI Conventional Commit candidates from staged changes")
    .action(async () => {
      const commitService = new CommitService();

      try {
        printAppHeader("Commit Assistant");

        const analysis = await withSpinner(
          "Analyzing staged changes...",
          () => commitService.requireStagedChanges(),
          (result) => `${result.files.length} file(s) staged`,
          "Analyze failed",
        );

        status.blank();
        status.info(formatCommitSummaryPanel(analysis));
        status.blank();

        const candidates = await withSpinner(
          "Generating commit candidates...",
          () => commitService.generateCommitCandidates(analysis),
          (result) => `${result.length} candidates ready`,
          "Failed to generate commit",
        );

        status.blank();
        status.muted("↑↓ Navigate   Enter Select");
        status.blank();

        const selected = await selectOption<CommitCandidate>(
          "Choose a commit message",
          candidates.map((candidate) => ({
            name: candidate.message,
            value: candidate,
            description: `Score ${candidate.score.score}/100${
              candidate.validation.valid ? "" : " · needs review"
            }`,
          })),
        );

        if (!selected) {
          status.warn("Commit cancelled.");
          return;
        }

        status.blank();
        status.info(formatSelectedCommitPanel(selected));
        status.blank();

        const confirmed = await confirmAction("Create this commit?", true);
        if (!confirmed) {
          status.warn("Commit cancelled.");
          return;
        }

        await withSpinner(
          "Creating commit...",
          () => commitService.createCommit(selected.message),
          "Commit created successfully",
          "Failed to create commit",
        );

        status.blank();
      } catch (error) {
        const message = sanitizeErrorMessage(getErrorMessage(error));
        status.error(message);
        process.exitCode = isAppError(error) ? error.exitCode : 1;
      }
    });
}
