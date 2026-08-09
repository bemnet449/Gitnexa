import type { Command } from "commander";
import ora from "ora";
import { HistoryService } from "../services/history.service.js";
import { DEFAULT_HISTORY_LIMIT } from "../config/constants.js";
import { formatHistory } from "../utils/formatter.js";
import { logger } from "../utils/logger.js";
import {
  getErrorMessage,
  isAppError,
  sanitizeErrorMessage,
} from "../utils/errors.js";

export function historyCommand(program: Command): void {
  program
    .command("history")
    .description("Show recent Git commits")
    .option(
      "-l, --limit <number>",
      "Number of commits to show",
      String(DEFAULT_HISTORY_LIMIT),
    )
    .action(async (options: { limit: string }) => {
      const spinner = ora("Loading commit history...").start();

      try {
        const parsed = Number.parseInt(options.limit, 10);
        const limit =
          Number.isFinite(parsed) && parsed > 0
            ? parsed
            : DEFAULT_HISTORY_LIMIT;

        const historyService = new HistoryService();
        const commits = await historyService.getRecent(limit);
        spinner.succeed(`Showing ${commits.length} commit(s)`);

        logger.blank();
        logger.info(formatHistory(commits));
      } catch (error) {
        spinner.fail("History failed");
        const message = sanitizeErrorMessage(getErrorMessage(error));
        logger.error(message);
        process.exitCode = isAppError(error) ? error.exitCode : 1;
      }
    });
}
