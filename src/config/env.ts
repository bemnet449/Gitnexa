import { config as loadEnv } from "dotenv";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Load GitSense environment variables from, in ascending priority:
 * 1. Package install directory (works with `npm link` / global install)
 * 2. ~/.gitsense/.env (optional user-wide config)
 * 3. Current working directory .env (per-project override)
 */
export function loadGitSenseEnv(): void {
  const packageRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );

  const candidates = [
    path.join(packageRoot, ".env"),
    path.join(homedir(), ".gitsense", ".env"),
  ];

  for (const envPath of candidates) {
    loadEnv({ path: envPath, quiet: true });
  }

  // Per-project overrides win when present.
  loadEnv({
    path: path.join(process.cwd(), ".env"),
    quiet: true,
    override: true,
  });
}
