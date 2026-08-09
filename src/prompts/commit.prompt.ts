import type { StagedAnalysis } from "../types/git.types.js";
import { MAX_DIFF_CHARS } from "../config/constants.js";
import { truncateDiff } from "../utils/formatter.js";

export function buildCommitPrompt(analysis: StagedAnalysis): string {
  const fileList = analysis.files.map((f) => `- ${f.path}`).join("\n");
  const diff = truncateDiff(analysis.diff, MAX_DIFF_CHARS);

  return `You are an expert software engineer writing Git commit messages.

Generate ONE Conventional Commit message for the staged changes below.

Rules:
- Follow Conventional Commits format: type(scope): description
- Allowed types: feat, fix, refactor, perf, docs, test, build, ci, chore, style
- Be concise (description ideally under 72 characters)
- Use the imperative mood (e.g. "add", "fix", "update")
- Do not invent changes that are not in the diff
- Base the message only on the actual code changes
- Include a scope when it clearly fits (directory, module, or feature name)
- Return ONLY the commit message subject line
- Never include Markdown code fences
- Never include explanations, quotes, or extra text

Repository: ${analysis.repo.name}
Branch: ${analysis.repo.branch}

Staged files:
${fileList || "(none)"}

Stats: +${analysis.stats.insertions} / -${analysis.stats.deletions} in ${analysis.stats.filesChanged} file(s)

Staged diff:
\`\`\`
${diff || "(empty diff)"}
\`\`\`
`;
}

export function parseCommitMessageResponse(raw: string): string {
  let text = raw.trim();

  // Strip Markdown fences if the model ignored instructions
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:\w+)?\n?/, "").replace(/\n?```$/, "");
  }

  // Prefer the first non-empty line as the subject
  const firstLine =
    text
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "";

  // Remove surrounding quotes
  return firstLine.replace(/^["'`]+|["'`]+$/g, "").trim();
}
