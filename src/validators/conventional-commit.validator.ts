import {
  CONVENTIONAL_TYPES,
  MAX_COMMIT_DESCRIPTION_LENGTH,
  MIN_COMMIT_DESCRIPTION_LENGTH,
  type ConventionalType,
} from "../config/constants.js";
import type { ValidationResult } from "../types/commit.types.js";

const CONVENTIONAL_PATTERN =
  /^(?<type>[a-z]+)(?:\((?<scope>[a-z0-9][a-z0-9./_-]*)\))?(?<breaking>!)?:\s(?<description>.+)$/;

export function validateConventionalCommit(message: string): ValidationResult {
  const reasons: string[] = [];
  const trimmed = message.trim();

  if (!trimmed) {
    return {
      valid: false,
      type: null,
      scope: null,
      description: null,
      reasons: ["Commit message is empty"],
    };
  }

  if (trimmed.includes("\n")) {
    reasons.push("Commit subject should be a single line");
  }

  const subject = trimmed.split("\n")[0]?.trim() ?? "";

  if (
    subject.startsWith("```") ||
    subject.endsWith("```") ||
    subject.includes("```")
  ) {
    reasons.push("Commit message should not include Markdown code fences");
  }

  const match = subject.match(CONVENTIONAL_PATTERN);

  if (!match?.groups) {
    reasons.push("Missing Conventional Commit structure (type: description)");
    return {
      valid: false,
      type: null,
      scope: null,
      description: null,
      reasons,
    };
  }

  const typeRaw = match.groups["type"] ?? "";
  const scope = match.groups["scope"] ?? null;
  const description = (match.groups["description"] ?? "").trim();

  const type = CONVENTIONAL_TYPES.includes(typeRaw as ConventionalType)
    ? (typeRaw as ConventionalType)
    : null;

  if (!type) {
    reasons.push(
      `Invalid commit type "${typeRaw}". Expected one of: ${CONVENTIONAL_TYPES.join(", ")}`,
    );
  }

  if (!description) {
    reasons.push("Description is missing");
  } else {
    if (description.length < MIN_COMMIT_DESCRIPTION_LENGTH) {
      reasons.push(
        `Description is too short (min ${MIN_COMMIT_DESCRIPTION_LENGTH} characters)`,
      );
    }
    if (description.length > MAX_COMMIT_DESCRIPTION_LENGTH) {
      reasons.push(
        `Description is too long (max ${MAX_COMMIT_DESCRIPTION_LENGTH} characters)`,
      );
    }
    if (/[.!?]$/.test(description)) {
      reasons.push("Description should not end with punctuation");
    }
    if (description[0] !== description[0]?.toLowerCase()) {
      reasons.push("Description should start with a lowercase letter");
    }
  }

  return {
    valid: reasons.length === 0,
    type,
    scope,
    description: description || null,
    reasons,
  };
}
