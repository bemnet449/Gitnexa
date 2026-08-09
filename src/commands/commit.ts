import type { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { CommitService } from "../services/commit.service.js";
import {
  formatCommitMessage,
  formatScore,
  formatValidation,
} from "../utils/formatter.js";
import { logger } from "../utils/logger.js";
import {
  getErrorMessage,
  isAppError,
  sanitizeErrorMessage,
} from "../utils/errors.js";

export function commitCommand(program: Command): void {
  program
    .command("commit")
    .description("Generate an AI Conventional Commit from staged changes")
    .action(async () => {
      const commitService = new CommitService();
      const analyzeSpinner = ora("Analyzing staged changes...").start();

      try {
        const analysis = await commitService.requireStagedChanges();
        analyzeSpinner.succeed(`${analysis.files.length} file(s) staged`);

        const generateSpinner = ora("Generating commit...").start();
        let generated: Awaited<
          ReturnType<CommitService["generateCommitMessage"]>
        >;
        try {
          generated = await commitService.generateCommitMessage(analysis);
          generateSpinner.succeed("Commit generated");
        } catch (error) {
          generateSpinner.fail("Failed to generate commit");
          throw error;
        }

        logger.blank();
        logger.info(chalk.bold("Generated commit:"));
        logger.info(formatCommitMessage(generated.message));
        logger.blank();
        logger.info(formatValidation(generated.validation));
        logger.blank();
        logger.info(formatScore(generated.score));
        logger.blank();

        const confirmed = await commitService.confirm(
          "Create this commit? (Y/n) ",
        );

        if (!confirmed) {
          logger.warn("Commit cancelled.");
          return;
        }

        const createSpinner = ora("Creating commit...").start();
        try {
          await commitService.createCommit(generated.message);
          createSpinner.succeed("Commit created successfully.");
        } catch (error) {
          createSpinner.fail("Failed to create commit");
          throw error;
        }
      } catch (error) {
        if (analyzeSpinner.isSpinning) {
          analyzeSpinner.fail("Commit workflow failed");
        }
        const message = sanitizeErrorMessage(getErrorMessage(error));
        logger.error(message);
        process.exitCode = isAppError(error) ? error.exitCode : 1;
      }
    });
}
