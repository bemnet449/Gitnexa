import { theme } from "./theme.js";
import { getTerminalWidth } from "./terminal.js";

function center(text: string, width: number): string {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(pad) + text;
}

export function renderAppHeader(
  subtitle = "AI-powered Git assistant",
): string {
  const WIDTH = Math.min(80, Math.max(44, getTerminalWidth()));
  const inner = WIDTH - 2;
  const top = theme.border("╭" + "─".repeat(inner) + "╮");
  const titleLine =
    theme.border("│") +
    theme.brandBold(center("GitSense", inner).padEnd(inner)) +
    theme.border("│");
  const subLine =
    theme.border("│") +
    theme.muted(center(subtitle, inner).padEnd(inner)) +
    theme.border("│");
  const bottom = theme.border("╰" + "─".repeat(inner) + "╯");
  return [top, titleLine, subLine, bottom].join("\n");
}

export function printAppHeader(subtitle?: string): void {
  console.log();
  console.log(renderAppHeader(subtitle));
  console.log();
}
