import type { Command } from "commander";
import { GitService } from "../services/git.service.js";
import { AIService } from "../services/ai.service.js";
import {
  buildExplainPrompt,
  parseExplainResponse,
} from "../prompts/explain.prompt.js";
import {
  extractAffectedAreas,
  formatExplainView,
} from "../utils/formatter.js";
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

export function explainCommand(program: Command): void {
  program
    .command("explain")
    .description("Explain a Git commit in simple technical language")
    .argument("[ref]", "Commit reference (default: HEAD)", "HEAD")
    .action(async (ref: string) => {
      try {
        printAppHeader("Explain");

        const git = new GitService();
        const ai = new AIService();

        const { commit, diff } = await withSpinner(
          `Loading commit ${ref}...`,
          async () => {
            const commitInfo = await git.getCommit(ref);
            const commitDiff = await git.getCommitDiff(ref);
            return { commit: commitInfo, diff: commitDiff };
          },
          (result) => `Loaded ${result.commit.shortHash}`,
          "Explain failed",
        );

        const explanation = await withSpinner(
          "Generating explanation...",
          async () => {
            const prompt = buildExplainPrompt(commit, diff);
            const response = await ai.generate(prompt, { temperature: 0.3 });
            return parseExplainResponse(response.text);
          },
          "Explanation ready",
          "Failed to generate explanation",
        );

        const affected = extractAffectedAreas(diff);

        status.blank();
        status.info(formatExplainView(commit, explanation, affected));
        status.blank();
      } catch (error) {
        const message = sanitizeErrorMessage(getErrorMessage(error));
        status.error(message);
        process.exitCode = isAppError(error) ? error.exitCode : 1;
      }
    });
}
