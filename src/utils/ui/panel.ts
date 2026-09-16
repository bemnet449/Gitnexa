import { theme } from "./theme.js";
import { getTerminalWidth } from "./terminal.js";

const DEFAULT_WIDTH = 44;

function visibleLength(text: string): number {
  // Strip ANSI escape codes for width calculation.
  return text.replace(/\u001b\[[0-9;]*m/g, "").length;
}

function padLine(content: string, innerWidth: number): string {
  const len = visibleLength(content);
  const pad = Math.max(0, innerWidth - len);
  return content + " ".repeat(pad);
}

export function renderPanel(
  title: string,
  lines: string[],
  width = Math.min(80, Math.max(DEFAULT_WIDTH, getTerminalWidth())),
): string {
  const innerWidth = Math.max(width - 2, 20);
  const titleText = title ? ` ${title} ` : "";
  const titleLen = visibleLength(titleText);
  const left = 1;
  const right = Math.max(0, innerWidth - left - titleLen);
  const top =
    theme.border("╭") +
    theme.border("─".repeat(left)) +
    theme.brandBold(titleText) +
    theme.border("─".repeat(right)) +
    theme.border("╮");

  const body = lines
    .map((line) => {
      const padded = padLine(` ${line}`, innerWidth);
      return `${theme.border("│")}${padded}${theme.border("│")}`;
    })
    .join("\n");

  const bottom =
    theme.border("╰") + theme.border("─".repeat(innerWidth)) + theme.border("╯");

  return [top, body, bottom].join("\n");
}

export function renderKeyValuePanel(
  title: string,
  rows: Array<{ key: string; value: string }>,
  width = Math.min(80, Math.max(DEFAULT_WIDTH, getTerminalWidth())),
): string {
  const keyWidth = Math.max(10, ...rows.map((r) => r.key.length));
  const lines = rows.map((row) => {
    const key = theme.muted(row.key.padEnd(keyWidth));
    return `${key}  ${row.value}`;
  });
  return renderPanel(title, lines.length > 0 ? lines : [theme.muted("—")], width);
}

export function printPanel(
  title: string,
  lines: string[],
  width = Math.min(80, Math.max(DEFAULT_WIDTH, getTerminalWidth())),
): void {
  console.log(renderPanel(title, lines, width));
}

export function printKeyValuePanel(
  title: string,
  rows: Array<{ key: string; value: string }>,
  width = Math.min(80, Math.max(DEFAULT_WIDTH, getTerminalWidth())),
): void {
  console.log(renderKeyValuePanel(title, rows, width));
}
