import chalk from "chalk";
import { theme } from "./theme.js";

export const status = {
  success(message: string): void {
    console.log(`${theme.success("✓")} ${message}`);
  },

  error(message: string): void {
    console.error(`${theme.error("✗")} ${message}`);
  },

  warn(message: string): void {
    console.log(`${theme.warn("⚠")} ${message}`);
  },

  info(message: string): void {
    console.log(message);
  },

  muted(message: string): void {
    console.log(theme.muted(message));
  },

  blank(): void {
    console.log();
  },

  section(title: string): void {
    console.log();
    console.log(theme.brandBold(title));
    console.log();
  },

  tip(message: string): void {
    console.log(theme.muted(`Tip: ${message}`));
  },

  score(score: number, max = 100): string {
    const color =
      score >= 80 ? chalk.green : score >= 50 ? chalk.yellow : chalk.red;
    return color(`${score}/${max}`);
  },
};
