import chalk from "chalk";
import type { CommitInfo, StagedAnalysis } from "../types/git.types.js";
import type { ScoreResult, ValidationResult } from "../types/commit.types.js";

export function formatStagedAnalysis(analysis: StagedAnalysis): string {
  const lines: string[] = [];

  lines.push(`${chalk.bold("Repository:")} ${analysis.repo.name}`);
  lines.push(`${chalk.bold("Branch:")} ${analysis.repo.branch}`);
  lines.push("");

  if (analysis.files.length === 0) {
    lines.push(chalk.yellow("No staged files."));
    return lines.join("\n");
  }

  lines.push(chalk.bold("Staged files:"));
  for (const file of analysis.files) {
    lines.push(`  • ${file.path}`);
  }

  lines.push("");
  lines.push(chalk.bold("Changes:"));
  lines.push(
    `  ${chalk.green(`+${analysis.stats.insertions}`)} / ${chalk.red(`-${analysis.stats.deletions}`)} across ${analysis.stats.filesChanged} file(s)`,
  );

  if (analysis.summaryLines.length > 0) {
    lines.push("");
    for (const summary of analysis.summaryLines) {
      lines.push(`  ${summary}`);
    }
  }

  return lines.join("\n");
}

export function formatCommitMessage(message: string): string {
  return chalk.cyan(message);
}

export function formatScore(score: ScoreResult): string {
  const lines: string[] = [];
  const color =
    score.score >= 80 ? chalk.green : score.score >= 50 ? chalk.yellow : chalk.red;

  lines.push(`${chalk.bold("Quality score:")} ${color(`${score.score}/${score.maxScore}`)}`);
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
    return chalk.dim(`Parsed: ${validation.type}${scope}: ${validation.description}`);
  }
  return chalk.yellow(`Validation issues: ${validation.reasons.join("; ")}`);
}

export function formatHistory(commits: CommitInfo[]): string {
  if (commits.length === 0) {
    return chalk.yellow("No commits found.");
  }

  const lines: string[] = [chalk.bold("Recent commits:"), ""];

  for (const commit of commits) {
    lines.push(
      `${chalk.yellow(commit.shortHash)}  ${commit.message}`,
    );
    lines.push(
      chalk.dim(`         ${commit.author} · ${commit.date}`),
    );
  }

  return lines.join("\n");
}

export function truncateDiff(diff: string, maxChars: number): string {
  if (diff.length <= maxChars) {
    return diff;
  }
  return `${diff.slice(0, maxChars)}\n\n...[diff truncated for AI context]...`;
}
