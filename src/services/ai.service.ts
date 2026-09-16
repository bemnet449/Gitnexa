import { GoogleGenerativeAI } from "@google/generative-ai";
import { DEFAULT_GEMINI_MODEL } from "../config/constants.js";
import type { AIGenerateOptions, AIResponse } from "../types/ai.types.js";
import { AppError, sanitizeErrorMessage } from "../utils/errors.js";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export class AIService {
  private readonly apiKey: string;
  private readonly modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    this.apiKey =
      apiKey ??
      process.env["GEMINI_API_KEY"] ??
      process.env["OPENROUTER_API_KEY"] ??
      "";
    this.modelName =
      modelName ?? process.env["GEMINI_MODEL"] ?? DEFAULT_GEMINI_MODEL;
  }

  ensureConfigured(): void {
    if (!this.apiKey.trim()) {
      throw new AppError(
        "AI API key is missing. Set GEMINI_API_KEY in your environment or .env file.",
        "MISSING_API_KEY",
      );
    }
  }

  /** OpenRouter keys and provider/model slugs use a different API than Google Gemini. */
  private usesOpenRouter(): boolean {
    return (
      this.apiKey.startsWith("sk-or-") ||
      this.modelName.includes("/") ||
      process.env["AI_PROVIDER"]?.toLowerCase() === "openrouter"
    );
  }

  async generate(
    prompt: string,
    options: AIGenerateOptions = {},
  ): Promise<AIResponse> {
    this.ensureConfigured();

    try {
      if (this.usesOpenRouter()) {
        return await this.generateViaOpenRouter(prompt, options);
      }
      return await this.generateViaGemini(prompt, options);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      const raw =
        error instanceof Error ? error.message : "Unknown AI provider error";
      const message = sanitizeErrorMessage(raw);

      if (/fetch failed|network|ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(message)) {
        throw new AppError(
          "Network failure while contacting the AI provider. Check your connection and try again.",
          "NETWORK_FAILURE",
        );
      }

      if (/API[_ ]?key|permission|401|403|unauthorized|invalid/i.test(message)) {
        throw new AppError(
          "AI API request failed. Check that your GEMINI_API_KEY is valid for the configured provider.",
          "AI_AUTH_FAILURE",
        );
      }

      throw new AppError(`AI API failure: ${message}`, "AI_FAILURE");
    }
  }

  private async generateViaGemini(
    prompt: string,
    options: AIGenerateOptions,
  ): Promise<AIResponse> {
    const client = new GoogleGenerativeAI(this.apiKey);
    const model = client.getGenerativeModel({
      model: this.modelName,
      ...(options.systemInstruction
        ? { systemInstruction: options.systemInstruction }
        : {}),
      generationConfig: {
        temperature: options.temperature ?? 0.2,
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text()?.trim() ?? "";

    if (!text) {
      throw new AppError(
        "AI provider returned an empty response. Try again.",
        "EMPTY_AI_RESPONSE",
      );
    }

    return { text, model: this.modelName };
  }

  private async generateViaOpenRouter(
    prompt: string,
    options: AIGenerateOptions,
  ): Promise<AIResponse> {
    const messages: Array<{ role: "system" | "user"; content: string }> = [];

    if (options.systemInstruction) {
      messages.push({ role: "system", content: options.systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/bemnet449/Gitzap",
        "X-Title": "Gitzap",
      },
      body: JSON.stringify({
        model: this.modelName,
        temperature: options.temperature ?? 0.2,
        messages,
      }),
    });

    const rawBody = await response.text();
    let parsed: {
      error?: {
        message?: string;
        metadata?: {
          raw?: unknown;
        };
      };
      choices?: Array<{ message?: { content?: string | null } }>;
    };

    try {
      parsed = JSON.parse(rawBody) as typeof parsed;
    } catch {
      throw new AppError(
        `AI provider returned a non-JSON response (HTTP ${response.status}).`,
        "INVALID_AI_RESPONSE",
      );
    }

    if (!response.ok) {
      let msg = parsed.error?.message ?? `HTTP ${response.status}`;
      const raw = parsed.error?.metadata?.raw;
      if (raw) {
        try {
          // Pretty-print parsed json if possible
          msg += ` - Detailed reason: ${typeof raw === "string" ? raw : JSON.stringify(raw)}`;
        } catch {
          msg += ` - Detailed reason: ${String(raw)}`;
        }
      }
      const detail = sanitizeErrorMessage(msg);
      throw new AppError(`AI API failure: ${detail}`, "AI_FAILURE");
    }

    const text = parsed.choices?.[0]?.message?.content?.trim() ?? "";

    if (!text) {
      throw new AppError(
        "AI provider returned an empty response. Try again.",
        "EMPTY_AI_RESPONSE",
      );
    }

    return { text, model: this.modelName };
  }
}
