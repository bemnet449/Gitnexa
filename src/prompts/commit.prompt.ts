import type { StagedAnalysis } from "../types/git.types.js";
import { MAX_DIFF_CHARS } from "../config/constants.js";
import { truncateDiff } from "../utils/formatter.js";

export function buildCommitPrompt(analysis: StagedAnalysis): string {
  const fileList = analysis.files.map((f) => `- ${f.path}`).join("\n");
  const diff = truncateDiff(analysis.diff, MAX_DIFF_CHARS);

  return `You are an expert software engineer reviewing a Git staged diff.

Your task is to generate ONE accurate Conventional Commit message that describes the PRIMARY purpose of the changes.

## Rules

1. Follow this format:
   type(scope): description

2. Allowed types:
   feat, fix, refactor, perf, docs, test, build, ci, chore, style

3. Choose the commit type based on the actual change:
   - feat: adds new user-facing or functional behavior
   - fix: fixes incorrect or broken behavior
   - refactor: changes code structure without changing behavior
   - perf: improves performance
   - docs: documentation-only changes
   - test: adds or changes tests
   - build: build system or dependency changes
   - ci: CI/CD configuration changes
   - chore: maintenance that does not fit the categories above
   - style: formatting/style-only changes

4. Describe the PRIMARY change, not every individual file.

5. Use imperative mood:
   "add", "fix", "remove", "update", "refactor", "improve"

6. Do NOT use vague descriptions such as:
   "update stuff"
   "make changes"
   "fix things"
   "update files"
   "changes"

7. Keep the description concise and ideally under 72 characters.

8. Use a scope only when the affected feature, module, or area is clear.
   Do not invent a scope.

9. Base the message ONLY on the provided staged diff and metadata.

10. Never invent functionality, behavior, files, or requirements that are not supported by the diff.

11. If the changes are formatting-only, prefer "style".

12. If multiple changes exist, identify the dominant/primary purpose and describe that.

13. If the diff clearly introduces a breaking change, use the appropriate Conventional Commit breaking-change notation.

14. Return ONLY the commit subject line.

15. Do NOT return:
   - explanations
   - bullet points
   - Markdown
   - code fences
   - quotation marks
   - multiple commit messages
   - prefixes such as "Commit:" or "Suggested commit:"

## Repository

Name: ${analysis.repo.name}
Branch: ${analysis.repo.branch}

## Staged files

${fileList || "(none)"}

## Change statistics

+${analysis.stats.insertions} / -${analysis.stats.deletions}
${analysis.stats.filesChanged} file(s) changed

## Staged diff

\`\`\`diff
${diff || "(empty diff)"}
\`\`\`

Generate the single best Conventional Commit subject now.`;
}

export function parseCommitMessageResponse(raw: string): string {
  let text = raw.trim();

  // Remove Markdown code fences.
  text = text
    .replace(/^```(?:\w+)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Get the first non-empty line.
  const firstLine =
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "";

  // Remove surrounding quotes.
  return firstLine.replace(/^["'`]+|["'`]+$/g, "").trim();
}