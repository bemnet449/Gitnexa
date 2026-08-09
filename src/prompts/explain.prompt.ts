import type { CommitInfo } from "../types/git.types.js";
import { MAX_DIFF_CHARS } from "../config/constants.js";
import { truncateDiff } from "../utils/formatter.js";

export function buildExplainPrompt(commit: CommitInfo, diff: string): string {
  const truncated = truncateDiff(diff, MAX_DIFF_CHARS);

  return `You are a senior engineer explaining a Git commit to another developer.

Explain what this commit changed in simple technical language.
Keep the explanation to 2-4 short sentences.
Do not invent details that are not supported by the commit message or diff.
Do not use Markdown headings or bullet lists.
Return plain text only.

Commit hash: ${commit.shortHash}
Author: ${commit.author}
Date: ${commit.date}
Subject: ${commit.message}
${commit.body ? `Body:\n${commit.body}\n` : ""}
Diff summary:
\`\`\`
${truncated || "(no diff available)"}
\`\`\`
`;
}

export function parseExplainResponse(raw: string): string {
  let text = raw.trim();

  if (text.startsWith("```")) {
    text = text.replace(/^```(?:\w+)?\n?/, "").replace(/\n?```$/, "").trim();
  }

  return text;
}
