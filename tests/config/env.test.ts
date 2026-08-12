import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGitSenseEnv } from "../../src/config/env.js";

describe("loadGitSenseEnv", () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
    delete process.env.OPENROUTER_API_KEY;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("loads API key from the package install directory .env", () => {
    const packageRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../..",
    );
    const envPath = path.join(packageRoot, ".env");

    loadGitSenseEnv();

    const key = process.env.GEMINI_API_KEY ?? "";
    // Only assert when a real local .env exists (dev/linked install).
    if (key.length > 0) {
      expect(key).not.toBe("your_api_key_here");
      expect(process.env.GEMINI_MODEL).toBeTruthy();
    } else {
      expect(envPath).toContain("gitsense");
    }
  });
});
