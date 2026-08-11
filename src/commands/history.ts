import type { Command } from "commander";
import { HistoryService } from "../services/history.service.js";
import { DEFAULT_HISTORY_LIMIT } from "../config/constants.js";
import { formatHistoryView } from "../utils/formatter.js";
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
      try {
        printAppHeader("History");

        const parsed = Number.parseInt(options.limit, 10);
        const limit =
          Number.isFinite(parsed) && parsed > 0
            ? parsed
            : DEFAULT_HISTORY_LIMIT;

        const historyService = new HistoryService();
        const commits = await withSpinner(
          "Loading commit history...",
          () => historyService.getRecent(limit),
          (result) => `Showing ${result.length} commit(s)`,
          "History failed",
        );

        status.blank();
        status.info(formatHistoryView(commits));
        status.blank();
      } catch (error) {
        const message = sanitizeErrorMessage(getErrorMessage(error));
        status.error(message);
        process.exitCode = isAppError(error) ? error.exitCode : 1;
      }
    });
}
