export const APP_NAME = "gitzap";
export const APP_VERSION = "1.0.0";

export const DEFAULT_HISTORY_LIMIT = 10;
export const MAX_DIFF_CHARS = 24_000;
export const MAX_COMMIT_DESCRIPTION_LENGTH = 72;
export const MIN_COMMIT_DESCRIPTION_LENGTH = 10;

export const CONVENTIONAL_TYPES = [
  "feat",
  "fix",
  "refactor",
  "perf",
  "docs",
  "test",
  "build",
  "ci",
  "chore",
  "style",
] as const;

export type ConventionalType = (typeof CONVENTIONAL_TYPES)[number];

export const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

export const VAGUE_WORDS = [
  "stuff",
  "things",
  "misc",
  "wip",
  "whatever",
  "something",
  "somehow",
] as const;

/** Descriptions that are entirely vague (exact or near-exact matches). */
export const VAGUE_DESCRIPTIONS = [
  "update",
  "updates",
  "changes",
  "fix",
  "fixes",
  "update stuff",
  "fix stuff",
  "various changes",
  "some changes",
  "misc updates",
] as const;
