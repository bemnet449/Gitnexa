import type { Command } from "commander";
import ora from "ora";
import { CommitService } from "../services/commit.service.js";
import { formatStagedAnalysis } from "../utils/formatter.js";
import { logger } from "../utils/logger.js";
import { getErrorMessage, isAppError, sanitizeErrorMessage } from "../utils/errors.js";

export function analyzeCommand(program: Command): void {
  program
    .command("analyze")
    .description("Analyze staged Git changes")
    .action(async () => {
      const spinner = ora("Analyzing staged changes...").start();

      try {
        const commitService = new CommitService();
        const analysis = await commitService.analyze();
        spinner.succeed(
          analysis.files.length > 0
            ? `${analysis.files.length} file(s) analyzed`
            : "No staged files",
        );

        logger.blank();
        logger.info(formatStagedAnalysis(analysis));

        if (analysis.files.length === 0) {
          logger.blank();
          logger.dim("Tip: stage changes with `git add` before analyzing.");
        }
      } catch (error) {
        spinner.fail("Analyze failed");
        const message = sanitizeErrorMessage(getErrorMessage(error));
        logger.error(message);
        process.exitCode = isAppError(error) ? error.exitCode : 1;
      }
    });
}
