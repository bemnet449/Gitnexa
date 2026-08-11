import type { StagedAnalysis } from "../types/git.types.js";
import { MAX_DIFF_CHARS } from "../config/constants.js";
import { truncateDiff } from "../utils/formatter.js";
import { AppError } from "../utils/errors.js";

export const COMMIT_CANDIDATE_COUNT = 3;

export function buildCommitPrompt(analysis: StagedAnalysis): string {
  const fileList = analysis.files.map((f) => `- ${f.path}`).join("\n");
  const diff = truncateDiff(analysis.diff, MAX_DIFF_CHARS);

  return `You are an expert software engineer reviewing a Git staged diff.

Your task is to generate exactly ${COMMIT_CANDIDATE_COUNT} different Conventional Commit message candidates for the SAME staged changes.

## Rules

1. Follow this format for every candidate:
   type(scope): description

2. Allowed types:
   feat, fix, refactor, perf, docs, test, build, ci, chore, style

3. All ${COMMIT_CANDIDATE_COUNT} candidates must describe the SAME actual changes.
   Vary wording, emphasis, or type/scope only when reasonably justified by the diff.

4. Candidates must NOT be duplicates or near-duplicates.
   Change verbs/phrasing meaningfully (e.g. "add" vs "implement" vs a justified alternate type).

5. Use imperative mood: "add", "fix", "remove", "update", "refactor", "improve"

6. Do NOT use vague descriptions such as "update stuff", "make changes", "fix things".

7. Keep each description concise and ideally under 72 characters.

8. Use a scope only when the affected feature, module, or area is clear.
   Do not invent a scope.

9. Base messages ONLY on the provided staged diff and metadata.
   Never invent functionality that is not supported by the diff.

10. If multiple changes exist, focus on the primary purpose.

## Output format

Return ONLY valid JSON with this exact shape (no Markdown, no code fences, no extra keys):

{
  "commits": [
    "type(scope): first candidate",
    "type(scope): second candidate",
    "type(scope): third candidate"
  ]
}

The "commits" array MUST contain exactly ${COMMIT_CANDIDATE_COUNT} non-empty strings.

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

Return the JSON object now.`;
}

/**
 * Strip optional Markdown fences and extract a JSON object substring.
 */
function extractJsonObject(raw: string): string {
  let text = raw.trim();

  text = text
    .replace(/^```(?:json|JSON)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }

  return text;
}

function normalizeCandidate(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const cleaned = value
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return cleaned && cleaned.length > 0 ? cleaned : null;
}

/**
 * Parse AI output into exactly 3 commit message candidates.
 * Accepts JSON `{ "commits": [...] }` and falls back to line-based extraction.
 */
export function parseCommitCandidates(raw: string): string[] {
  const text = raw.trim();
  if (!text) {
    throw new AppError(
      "AI returned an empty response for commit candidates.",
      "INVALID_AI_RESPONSE",
    );
  }

  const candidates: string[] = [];

  try {
    const jsonText = extractJsonObject(text);
    const parsed: unknown = JSON.parse(jsonText);

    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { commits?: unknown }).commits)
    ) {
      for (const item of (parsed as { commits: unknown[] }).commits) {
        const message = normalizeCandidate(item);
        if (message) {
          candidates.push(message);
        }
      }
    }
  } catch {
    // Fall through to line-based parsing.
  }

  if (candidates.length < COMMIT_CANDIDATE_COUNT) {
    const lineCandidates = text
      .replace(/^```(?:json|JSON)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .split(/\r?\n/)
      .map((line) =>
        line
          .replace(/^\s*[-*\d.)]+\s*/, "")
          .replace(/^["'`]+|["'`]+$/g, "")
          .trim(),
      )
      .filter((line) => /^[a-z]+(\([^)]+\))?!?:\s+.+/i.test(line));

    for (const line of lineCandidates) {
      if (!candidates.includes(line)) {
        candidates.push(line);
      }
      if (candidates.length >= COMMIT_CANDIDATE_COUNT) {
        break;
      }
    }
  }

  // Deduplicate while preserving order
  const unique = [...new Set(candidates)].slice(0, COMMIT_CANDIDATE_COUNT);

  if (unique.length < COMMIT_CANDIDATE_COUNT) {
    throw new AppError(
      `AI returned ${unique.length} commit candidate(s); expected ${COMMIT_CANDIDATE_COUNT}.`,
      "INVALID_AI_RESPONSE",
    );
  }

  return unique;
}

/** @deprecated Prefer parseCommitCandidates for the multi-candidate flow. */
export function parseCommitMessageResponse(raw: string): string {
  try {
    const candidates = parseCommitCandidates(raw);
    return candidates[0] ?? "";
  } catch {
    let text = raw.trim();
    text = text
      .replace(/^```(?:\w+)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const firstLine =
      text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line.length > 0) ?? "";
    return firstLine.replace(/^["'`]+|["'`]+$/g, "").trim();
  }
}
