#!/usr/bin/env node
import { Command } from "commander";
import { APP_NAME, APP_VERSION } from "./config/constants.js";
import { loadGitSenseEnv } from "./config/env.js";
import { analyzeCommand } from "./commands/analyze.js";
import { commitCommand } from "./commands/commit.js";
import { historyCommand } from "./commands/history.js";
import { explainCommand } from "./commands/explain.js";

loadGitSenseEnv();

const program = new Command();

program
  .name(APP_NAME)
  .description(
    "AI-powered Git assistant — analyze staged changes, generate Conventional Commits, and explain history.",
  )
  .version(APP_VERSION);

analyzeCommand(program);
commitCommand(program);
historyCommand(program);
explainCommand(program);

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`✗ ${message}`);
  process.exitCode = 1;
});
