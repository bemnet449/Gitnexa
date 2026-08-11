import chalk from "chalk";
import type { CommitInfo, StagedAnalysis, StagedFile } from "../types/git.types.js";
import type {
  CommitCandidate,
  ScoreResult,
  ValidationResult,
} from "../types/commit.types.js";
import { theme } from "./ui/theme.js";
import { renderKeyValuePanel, renderPanel } from "./ui/panel.js";

export function fileStatusIcon(indexStatus: string): string {
  switch (indexStatus) {
    case "A":
      return theme.add("+");
    case "D":
      return theme.remove("-");
    case "M":
      return theme.warn("~");
    case "R":
      return theme.accent("→");
    default:
      return theme.muted("•");
  }
}

export function formatRelativeTime(dateInput: string): string {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return dateInput;
  }

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.round(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export function formatAnalyzeView(analysis: StagedAnalysis): string {
  const statusText =
    analysis.files.length === 0
      ? theme.warn("No staged files")
      : `${analysis.files.length} staged file${analysis.files.length === 1 ? "" : "s"}`;

  const header = renderKeyValuePanel("GitSense", [
    { key: "Repository", value: analysis.repo.name },
    { key: "Branch", value: analysis.repo.branch },
    { key: "Status", value: statusText },
  ]);

  if (analysis.files.length === 0) {
    return header;
  }

  const fileLines = analysis.files.map(
    (file: StagedFile) =>
      `${fileStatusIcon(file.indexStatus)} ${file.path}`,
  );

  const filesSection = [
    theme.brandBold("Staged Changes"),
    "",
    ...fileLines,
  ].join("\n");

  const summary = [
    theme.brandBold("Summary"),
    "",
    `${theme.add(`+${analysis.stats.insertions}`)} additions`,
    `${theme.remove(`-${analysis.stats.deletions}`)} deletions`,
  ].join("\n");

  return [header, "", filesSection, "", summary].join("\n");
}

export function formatCommitSummaryPanel(analysis: StagedAnalysis): string {
  return renderKeyValuePanel("Commit Assistant", [
    {
      key: "Staged",
      value: `${analysis.files.length} file${analysis.files.length === 1 ? "" : "s"}`,
    },
    {
      key: "Changes",
      value: `${theme.add(`+${analysis.stats.insertions}`)} / ${theme.remove(`-${analysis.stats.deletions}`)}`,
    },
    { key: "Branch", value: analysis.repo.branch },
  ]);
}

function wrapPlainText(text: string, width: number): string[] {
  if (text.length <= width) {
    return [text];
  }
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines.length > 0 ? lines : [text];
}

export function formatSelectedCommitPanel(candidate: CommitCandidate): string {
  const scoreColor =
    candidate.score.score >= 80
      ? chalk.green
      : candidate.score.score >= 50
        ? chalk.yellow
        : chalk.red;

  const width = 52;
  const inner = width - 4;
  const messageLines = wrapPlainText(candidate.message, inner).map((line) =>
    theme.highlight(line),
  );

  const lines = [
    ...messageLines,
    "",
    `${theme.muted("Score".padEnd(10))}  ${scoreColor(`${candidate.score.score}/${candidate.score.maxScore}`)}`,
    `${theme.muted("Type".padEnd(10))}  ${candidate.validation.type ?? theme.warn("—")}`,
    `${theme.muted("Scope".padEnd(10))}  ${candidate.validation.scope ?? theme.muted("—")}`,
    `${theme.muted("Status".padEnd(10))}  ${
      candidate.validation.valid
        ? theme.success("✓ Valid")
        : theme.error("✗ Invalid")
    }`,
  ];

  const breakdown = candidate.score.items
    .filter((item) => item.label.length < 60)
    .slice(0, 6)
    .map((item) => {
      const mark = item.passed ? theme.success("✓") : theme.error("✗");
      return `${mark} ${item.label}`;
    });

  if (breakdown.length > 0) {
    lines.push("");
    lines.push(...breakdown);
  }

  return renderPanel("Selected Commit", lines, width);
}

export function formatHistoryView(commits: CommitInfo[]): string {
  if (commits.length === 0) {
    return theme.warn("No commits found.");
  }

  const blocks = commits.map((commit) => {
    const hash = theme.hash(commit.shortHash);
    const message = theme.highlight(commit.message);
    const meta = theme.muted(
      `${commit.author} · ${formatRelativeTime(commit.date)}`,
    );
    return `${hash}   ${message}\n${" ".repeat(10)}${meta}`;
  });

  return [theme.brandBold("GitSense History"), "", ...blocks].join("\n\n");
}

export function formatExplainView(
  commit: CommitInfo,
  explanation: string,
  files: string[],
  stats: { filesChanged: number; insertions: number; deletions: number },
  options: { diffTruncated?: boolean } = {},
): string {
  const width = 48;
  const dateLabel = formatDisplayDate(commit.date);
  const messageLines = wrapPlainText(commit.message, width - 4).map((line) =>
    theme.highlight(line),
  );

  const header = renderPanel(
    "GitSense · Commit Explanation",
    [
      "",
      theme.hash(commit.shortHash),
      ...messageLines,
      "",
      `${theme.muted("Author".padEnd(8))}  ${commit.author}`,
      `${theme.muted("Date".padEnd(8))}  ${dateLabel}`,
    ],
    width,
  );

  const sections: string[] = [header, ""];

  sections.push(theme.brandBold("What changed"));
  sections.push(theme.border("─".repeat(44)));
  sections.push("");
  sections.push(wrapPlainText(explanation.trim(), 44).join("\n"));

  if (options.diffTruncated) {
    sections.push("");
    sections.push(
      theme.muted(
        "Note: explanation is based on a truncated or limited diff.",
      ),
    );
  }

  if (files.length > 0) {
    sections.push("");
    sections.push(theme.brandBold("Affected files"));
    sections.push(theme.border("─".repeat(44)));
    sections.push("");
    for (const file of files.slice(0, 12)) {
      sections.push(`  ${file}`);
    }
    if (files.length > 12) {
      sections.push(theme.muted(`  …and ${files.length - 12} more`));
    }
  }

  if (
    stats.filesChanged > 0 ||
    stats.insertions > 0 ||
    stats.deletions > 0
  ) {
    sections.push("");
    sections.push(theme.brandBold("Change summary"));
    sections.push(theme.border("─".repeat(44)));
    sections.push("");
    sections.push(`  ${theme.add(`+${stats.insertions}`)} additions`);
    sections.push(`  ${theme.remove(`-${stats.deletions}`)} deletions`);
    sections.push(
      `  ${stats.filesChanged} file${stats.filesChanged === 1 ? "" : "s"} changed`,
    );
  }

  return sections.join("\n");
}

export function formatDisplayDate(dateInput: string): string {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return dateInput;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function extractAffectedFiles(diff: string): string[] {
  const paths = new Set<string>();
  const patterns = [
    /^diff --git a\/(.+?) b\/(.+)$/gm,
    /^\+\+\+ b\/(.+)$/gm,
  ];

  for (const pattern of patterns) {
    for (const match of diff.matchAll(pattern)) {
      const filePath = match[2] ?? match[1];
      if (filePath && filePath !== "/dev/null") {
        paths.add(filePath);
      }
    }
  }

  return [...paths];
}

export function extractAffectedAreas(diff: string): string[] {
  const paths = new Set<string>();
  for (const filePath of extractAffectedFiles(diff)) {
    const parts = filePath.split("/");
    const area = parts.length > 1 ? `${parts[0]}/` : filePath;
    paths.add(area);
  }
  return [...paths].slice(0, 8);
}

export function formatCommitMessage(message: string): string {
  return chalk.cyan(message);
}

export function formatScore(score: ScoreResult): string {
  const lines: string[] = [];
  const color =
    score.score >= 80 ? chalk.green : score.score >= 50 ? chalk.yellow : chalk.red;

  lines.push(
    `${chalk.bold("Quality score:")} ${color(`${score.score}/${score.maxScore}`)}`,
  );
  lines.push("");

  for (const item of score.items) {
    const mark = item.passed ? chalk.green("✓") : chalk.red("✗");
    lines.push(`${mark} ${item.label}`);
  }

  return lines.join("\n");
}

export function formatValidation(validation: ValidationResult): string {
  if (validation.valid) {
    const scope = validation.scope ? `(${validation.scope})` : "";
    return chalk.dim(
      `Parsed: ${validation.type}${scope}: ${validation.description}`,
    );
  }
  return chalk.yellow(`Validation issues: ${validation.reasons.join("; ")}`);
}

export function formatStagedAnalysis(analysis: StagedAnalysis): string {
  return formatAnalyzeView(analysis);
}

export function formatHistory(commits: CommitInfo[]): string {
  return formatHistoryView(commits);
}

export function truncateDiff(diff: string, maxChars: number): string {
  if (diff.length <= maxChars) {
    return diff;
  }
  return `${diff.slice(0, maxChars)}\n\n...[diff truncated for AI context]...`;
}
