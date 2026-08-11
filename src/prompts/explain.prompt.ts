import type { CommitInfo } from "../types/git.types.js";
import { MAX_DIFF_CHARS } from "../config/constants.js";
import { truncateDiff } from "../utils/formatter.js";

export function buildExplainPrompt(
  commit: CommitInfo,
  diff: string
): string {
  const truncated = truncateDiff(diff, MAX_DIFF_CHARS);

  return `You are a senior software engineer explaining a Git commit to another developer.

Explain the commit clearly using the commit message and diff provided below.

## What to explain

- What was changed
- The main technical purpose of the change
- The most important files or areas affected
- The practical impact of the change when it can be determined from the diff

## Rules

1. Use simple, technical language.
2. Keep the explanation to 2-4 short sentences.
3. Focus on the PRIMARY purpose of the commit.
4. Base the explanation ONLY on the commit message and provided diff.
5. Do not invent functionality, reasons, behavior, or implementation details.
6. If the diff is incomplete or truncated, do not assume what the missing code contains.
7. Do not repeat the commit message without explaining the actual change.
8. Do not provide code unless it is necessary to explain the change.
9. Do not give recommendations or opinions about the code.
10. Do not use Markdown headings, bullet points, or code blocks.
11. Return plain text only.

## Commit information

Hash: ${commit.shortHash}
Author: ${commit.author}
Date: ${commit.date}
Subject: ${commit.message}
${commit.body ? `Body:\n${commit.body}\n` : ""}

## Diff

\`\`\`diff
${truncated || "(no diff available)"}
\`\`\`

Explain this commit now.`;
}

export function parseExplainResponse(raw: string): string {
  let text = raw.trim();

  // Remove Markdown code fences if the model ignored instructions.
  text = text
    .replace(/^```(?:\w+)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Remove unnecessary surrounding quotes.
  text = text.replace(/^["'`]+|["'`]+$/g, "").trim();

  return text;
}