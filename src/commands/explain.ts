import type { Command } from "commander";
import { ExplainService } from "../services/explain.service.js";
import { formatExplainView } from "../utils/formatter.js";
import {
  printAppHeader,
  status,
  withSpinner,
} from "../utils/ui/index.js";
import {
  selectCommitFromList,
  selectExplainMode,
} from "../utils/ui/commit-selection.js";
import {
  getErrorMessage,
  isAppError,
  sanitizeErrorMessage,
} from "../utils/errors.js";

export function explainCommand(program: Command): void {
  program
    .command("explain")
    .description("Explain a Git commit in simple technical language")
    .argument(
      "[ref]",
      "Commit hash or ref. Omit to choose interactively.",
    )
    .action(async (ref?: string) => {
      const explainService = new ExplainService();

      try {
        printAppHeader("Explain");

        await explainService.ensureRepository();

        let targetRef = ref?.trim() || "";

        if (!targetRef) {
          const mode = await selectExplainMode();
          if (!mode) {
            status.warn("Explain cancelled.");
            return;
          }

          if (mode === "last") {
            targetRef = "HEAD";
          } else {
            const commits = await withSpinner(
              "Loading recent commits...",
              () => explainService.getRecentCommits(15),
              (list) => `${list.length} commit(s) available`,
              "Failed to load commits",
            );

            status.blank();
            const selected = await selectCommitFromList(commits);
            if (!selected) {
              status.warn("Explain cancelled.");
              return;
            }
            targetRef = selected;
          }
        }

        const result = await withSpinner(
          `Explaining ${targetRef}...`,
          () => explainService.explainCommit(targetRef),
          (res) => `Explained ${res.details.commit.shortHash}`,
          "Explain failed",
        );

        const filePaths = result.details.files.map((file) => file.path);

        status.blank();
        status.info(
          formatExplainView(
            result.details.commit,
            result.explanation,
            filePaths,
            result.details.stats,
            { diffTruncated: result.details.diffTruncated },
          ),
        );
        status.blank();
      } catch (error) {
        const message = sanitizeErrorMessage(getErrorMessage(error));
        status.error(message);
        process.exitCode = isAppError(error) ? error.exitCode : 1;
      }
    });
}
