import type { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { GitService } from "../services/git.service.js";
import { AIService } from "../services/ai.service.js";
import {
  buildExplainPrompt,
  parseExplainResponse,
} from "../prompts/explain.prompt.js";
import { logger } from "../utils/logger.js";
import {
  getErrorMessage,
  isAppError,
  sanitizeErrorMessage,
} from "../utils/errors.js";

export function explainCommand(program: Command): void {
  program
    .command("explain")
    .description("Explain a Git commit in simple technical language")
    .argument("[ref]", "Commit reference (default: HEAD)", "HEAD")
    .action(async (ref: string) => {
      const spinner = ora(`Loading commit ${ref}...`).start();

      try {
        const git = new GitService();
        const ai = new AIService();

        const commit = await git.getCommit(ref);
        const diff = await git.getCommitDiff(ref);
        spinner.succeed(`Loaded ${commit.shortHash}`);

        const explainSpinner = ora("Generating explanation...").start();
        const prompt = buildExplainPrompt(commit, diff);
        const response = await ai.generate(prompt, { temperature: 0.3 });
        const explanation = parseExplainResponse(response.text);
        explainSpinner.succeed("Explanation ready");

        logger.blank();
        logger.info(chalk.bold("Commit:"));
        logger.info(chalk.cyan(commit.message));
        logger.blank();
        logger.info(chalk.bold("Explanation:"));
        logger.info(explanation);
      } catch (error) {
        spinner.fail("Explain failed");
        const message = sanitizeErrorMessage(getErrorMessage(error));
        logger.error(message);
        process.exitCode = isAppError(error) ? error.exitCode : 1;
      }
    });
}
