import type { Command } from "commander";
import { CommitService } from "../services/commit.service.js";
import { formatAnalyzeView } from "../utils/formatter.js";
import {
  printAppHeader,
  status,
  withSpinner,
} from "../utils/ui/index.js";
import {
  getErrorMessage,
  isAppError,
  sanitizeErrorMessage,
} from "../utils/errors.js";

export function analyzeCommand(program: Command): void {
  program
    .command("analyze")
    .description("Analyze staged Git changes")
    .action(async () => {
      try {
        printAppHeader();

        const commitService = new CommitService();
        const analysis = await withSpinner(
          "Analyzing staged changes...",
          () => commitService.analyze(),
          (result) =>
            result.files.length > 0
              ? `${result.files.length} file(s) analyzed`
              : "No staged files",
          "Analyze failed",
        );

        status.blank();
        status.info(formatAnalyzeView(analysis));

        if (analysis.files.length === 0) {
          status.blank();
          status.tip("stage changes with `git add` before analyzing.");
        }

        status.blank();
      } catch (error) {
        const message = sanitizeErrorMessage(getErrorMessage(error));
        status.error(message);
        process.exitCode = isAppError(error) ? error.exitCode : 1;
      }
    });
}
