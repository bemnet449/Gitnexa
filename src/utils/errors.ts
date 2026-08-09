export class AppError extends Error {
  readonly code: string;
  readonly exitCode: number;

  constructor(message: string, code = "APP_ERROR", exitCode = 1) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.exitCode = exitCode;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/** Strip potential secrets from error messages before display. */
export function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED]")
    .replace(/sk-or-v1-[0-9A-Za-z_-]+/g, "[REDACTED]")
    .replace(/GEMINI_API_KEY[=:]\s*\S+/gi, "GEMINI_API_KEY=[REDACTED]")
    .replace(/OPENROUTER_API_KEY[=:]\s*\S+/gi, "OPENROUTER_API_KEY=[REDACTED]")
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]");
}
