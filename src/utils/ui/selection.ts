import { select, confirm as inquirerConfirm } from "@inquirer/prompts";
import chalk from "chalk";
import { theme } from "./theme.js";

export interface SelectOption<T> {
  name: string;
  value: T;
  description?: string;
}

/**
 * Arrow-key selection. Returns the chosen value, or null if cancelled (Ctrl+C).
 */
export async function selectOption<T>(
  message: string,
  choices: SelectOption<T>[],
): Promise<T | null> {
  try {
    const value = await select<T>({
      message,
      choices: choices.map((choice) => ({
        name: choice.name,
        value: choice.value,
        ...(choice.description ? { description: choice.description } : {}),
      })),
      theme: {
        style: {
          highlight: (text: string) => chalk.cyan.bold(text),
          answer: (text: string) => chalk.cyan(text),
          message: (text: string) => chalk.white.bold(text),
          help: (text: string) => chalk.dim(text),
        },
        prefix: {
          idle: theme.pointer,
          done: theme.success("✓"),
        },
      },
      loop: false,
    });
    return value;
  } catch {
    // User cancelled (Ctrl+C) or non-interactive terminal.
    return null;
  }
}

export async function confirmAction(
  message: string,
  defaultValue = true,
): Promise<boolean> {
  try {
    return await inquirerConfirm({
      message,
      default: defaultValue,
      theme: {
        style: {
          message: (text: string) => chalk.white.bold(text),
          answer: (text: string) => chalk.cyan(text),
        },
        prefix: {
          idle: theme.pointer,
          done: theme.success("✓"),
        },
      },
    });
  } catch {
    return false;
  }
}
