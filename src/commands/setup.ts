import { existsSync, mkdirSync, writeFileSync, chmodSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import type { Command } from "commander";
import { password, input, select } from "@inquirer/prompts";
import { printAppHeader, status } from "../utils/ui/index.js";
import { DEFAULT_GEMINI_MODEL } from "../config/constants.js";
import { getErrorMessage } from "../utils/errors.js";

const CONFIG_DIR = path.join(homedir(), ".gitsense");
const CONFIG_FILE = path.join(CONFIG_DIR, ".env");

function detectProvider(apiKey: string, model: string): "OpenRouter" | "Google Gemini" {
  if (apiKey.startsWith("sk-or-") || model.includes("/")) {
    return "OpenRouter";
  }
  return "Google Gemini";
}

function maskKey(key: string): string {
  if (key.length <= 8) return "*".repeat(key.length);
  return `${key.slice(0, 4)}${"*".repeat(key.length - 8)}${key.slice(-4)}`;
}

function readExistingConfig(): { apiKey: string; model: string } | null {
  if (!existsSync(CONFIG_FILE)) return null;
  const raw = readFileSync(CONFIG_FILE, "utf-8");
  const apiKey = raw.match(/GEMINI_API_KEY=(.*)/)?.[1]?.trim() ?? "";
  const model = raw.match(/GEMINI_MODEL=(.*)/)?.[1]?.trim() ?? DEFAULT_GEMINI_MODEL;
  return { apiKey, model };
}

function saveConfig(apiKey: string, model: string): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  const fileContents = `GEMINI_API_KEY=${apiKey.trim()}\nGEMINI_MODEL=${model}\n`;
  writeFileSync(CONFIG_FILE, fileContents, { encoding: "utf-8" });
  try {
    chmodSync(CONFIG_FILE, 0o600);
  } catch {
    // Ignore on platforms without POSIX permissions.
  }
}

export function setupCommand(program: Command): void {
  program
    .command("setup")
    .description("Configure or update your AI provider API key and model")
    .action(async () => {
      try {
        printAppHeader();
        status.section("GitSense Setup");

        const existing = readExistingConfig();

        if (existing) {
          status.info(`Current API key: ${maskKey(existing.apiKey)}`);
          status.info(`Current model: ${existing.model}`);
          status.blank();

          const choice = await select({
            message: "What would you like to do?",
            choices: [
              { name: "Update API key only", value: "key" },
              { name: "Update model only", value: "model" },
              { name: "Update both", value: "both" },
              { name: "Cancel", value: "cancel" },
            ],
          });

          if (choice === "cancel") {
            status.info("No changes made.");
            return;
          }

          let apiKey = existing.apiKey;
          let model = existing.model;

          if (choice === "key" || choice === "both") {
            apiKey = await password({
              message: "Enter your new API key:",
              mask: "*",
              validate: (value) =>
                value.trim().length > 0 ? true : "API key cannot be empty.",
            });
          }

          if (choice === "model" || choice === "both") {
            const modelInput = await input({
              message: `Enter new model name (leave blank to keep "${model}"):`,
            });
            model = modelInput.trim() || model;
          }

          saveConfig(apiKey, model);
          const provider = detectProvider(apiKey.trim(), model);

          status.blank();
          status.success(`Configuration updated at ${CONFIG_FILE}`);
          status.info(`Detected provider: ${provider}`);
          status.info(`Model: ${model}`);
          return;
        }

        // First-time setup (no existing config)
        status.muted(
          "Get a key from https://aistudio.google.com/apikey (Gemini) or https://openrouter.ai/keys (OpenRouter).",
        );
        status.blank();

        const apiKey = await password({
          message: "Enter your API key:",
          mask: "*",
          validate: (value) =>
            value.trim().length > 0 ? true : "API key cannot be empty.",
        });

        const modelInput = await input({
          message: `Enter model name (leave blank for default: ${DEFAULT_GEMINI_MODEL}):`,
        });

        const model = modelInput.trim() || DEFAULT_GEMINI_MODEL;
        saveConfig(apiKey, model);
        const provider = detectProvider(apiKey.trim(), model);

        status.blank();
        status.success(`Configuration saved to ${CONFIG_FILE}`);
        status.info(`Detected provider: ${provider}`);
        status.info(`Model: ${model}`);
        status.blank();
        status.tip("Run `gitsense analyze` or `gitsense commit` inside any Git repo to get started.");
      } catch (error) {
        status.error(getErrorMessage(error));
        process.exitCode = 1;
      }
    });
}
