import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { AIService } from "../../src/services/ai.service.js";
import { AppError } from "../../src/utils/errors.js";

vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: class {
      constructor(private readonly key: string) {}
      getGenerativeModel() {
        return {
          generateContent: async () => ({
            response: {
              text: () => "feat(auth): add refresh token authentication",
            },
          }),
        };
      }
    },
  };
});

describe("AIService", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws when API key is missing", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    const ai = new AIService("");
    expect(() => ai.ensureConfigured()).toThrow(AppError);
  });

  it("parses a successful mocked Gemini response", async () => {
    const ai = new AIService("test-key", "gemini-2.0-flash");
    const result = await ai.generate("prompt");
    expect(result.text).toBe("feat(auth): add refresh token authentication");
    expect(result.model).toBe("gemini-2.0-flash");
  });

  it("parses a successful mocked OpenRouter response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            choices: [
              {
                message: {
                  content: "feat(api): add rate limiting",
                },
              },
            ],
          }),
      })),
    );

    const ai = new AIService("sk-or-v1-test", "poolside/laguna-s-2.1:free");
    const result = await ai.generate("prompt");
    expect(result.text).toBe("feat(api): add rate limiting");
    expect(result.model).toBe("poolside/laguna-s-2.1:free");
  });
});
