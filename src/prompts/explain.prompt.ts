import type { CommitInfo } from "../types/git.types.js";
import { MAX_DIFF_CHARS } from "../config/constants.js";
import { truncateDiff } from "../utils/formatter.js";

export function buildExplainPrompt(
  commit: CommitInfo,
  diff: string,
  options: { truncated?: boolean } = {},
): string {
  const truncated = truncateDiff(diff, MAX_DIFF_CHARS);
  const wasTruncated =
    options.truncated === true || diff.length > MAX_DIFF_CHARS;

  return `You are a senior software engineer explaining a Git commit to another developer.

Explain the commit clearly using the commit message and diff provided below.

## What to explain

- What was changed
- The main technical purpose of the change
- Important technical details that are visible in the diff
- The practical impact of the change when it can be determined from the diff

## Rules

1. Use simple, technical language.
2. Keep the explanation to 2-4 short sentences.
3. Focus on the PRIMARY purpose of the commit.
4. Base the explanation ONLY on the commit message and provided diff.
5. Do not invent functionality, reasons, behavior, or implementation details.
6. ${
    wasTruncated
      ? "The diff is truncated or incomplete. Clearly note that the explanation is based on limited information, and do not assume what the missing code contains."
      : "If the diff appears incomplete, do not assume what the missing code contains."
  }
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
${wasTruncated ? "\nNote: The diff below may be truncated.\n" : ""}
## Diff

\`\`\`diff
${truncated || "(no diff available)"}
\`\`\`

Explain this commit now.`;
}

export function parseExplainResponse(raw: string): string {
  let text = raw.trim();

  text = text
    .replace(/^```(?:\w+)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  text = text.replace(/^["'`]+|["'`]+$/g, "").trim();

  return text;
}
