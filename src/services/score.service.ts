import {
  MAX_COMMIT_DESCRIPTION_LENGTH,
  MIN_COMMIT_DESCRIPTION_LENGTH,
  VAGUE_DESCRIPTIONS,
  VAGUE_WORDS,
} from "../config/constants.js";
import type { ScoreResult } from "../types/commit.types.js";
import { validateConventionalCommit } from "../validators/conventional-commit.validator.js";

const ACTION_VERBS = [
  "add",
  "fix",
  "update",
  "remove",
  "refactor",
  "improve",
  "implement",
  "create",
  "delete",
  "resolve",
  "support",
  "enable",
  "disable",
  "migrate",
  "optimize",
  "simplify",
  "introduce",
  "replace",
  "prevent",
  "allow",
  "handle",
  "adjust",
  "correct",
  "document",
  "test",
  "bump",
  "configure",
];

function isVagueDescription(description: string): boolean {
  const lower = description.toLowerCase().trim();
  if (!lower) {
    return true;
  }

  if (VAGUE_DESCRIPTIONS.includes(lower as (typeof VAGUE_DESCRIPTIONS)[number])) {
    return true;
  }

  const tokens = lower.split(/[^a-z0-9]+/).filter(Boolean);
  return tokens.some((token) =>
    VAGUE_WORDS.includes(token as (typeof VAGUE_WORDS)[number]),
  );
}

export class ScoreService {
  score(message: string): ScoreResult {
    const validation = validateConventionalCommit(message);
    const subject = message.trim().split("\n")[0]?.trim() ?? "";
    const description = validation.description ?? subject;
    const lower = description.toLowerCase();

    const items: ScoreResult["items"] = [];

    items.push({
      label: "Valid Conventional Commit",
      passed: validation.valid,
      points: validation.valid ? 30 : 0,
    });

    items.push({
      label: "Valid commit type",
      passed: validation.type !== null,
      points: validation.type ? 15 : 0,
    });

    const hasClearDescription =
      Boolean(validation.description) &&
      validation.description!.length >= MIN_COMMIT_DESCRIPTION_LENGTH &&
      validation.description!.length <= MAX_COMMIT_DESCRIPTION_LENGTH;

    items.push({
      label: "Clear description",
      passed: hasClearDescription,
      points: hasClearDescription ? 20 : 0,
    });

    const hasAction = ACTION_VERBS.some(
      (verb) => lower.startsWith(`${verb} `) || lower === verb,
    );

    items.push({
      label: "Good action wording",
      passed: hasAction,
      points: hasAction ? 15 : 0,
    });

    const hasScope = Boolean(validation.scope);
    items.push({
      label: "Appropriate scope",
      passed: hasScope,
      points: hasScope ? 10 : 0,
    });

    const vague = isVagueDescription(description);
    items.push({
      label: "Description is specific (not vague)",
      passed: !vague,
      points: !vague ? 10 : 0,
    });

    if (!validation.valid && validation.reasons.length > 0) {
      for (const reason of validation.reasons.slice(0, 3)) {
        const alreadyListed = items.some((item) => item.label === reason);
        if (!alreadyListed) {
          items.push({
            label: reason,
            passed: false,
            points: 0,
          });
        }
      }
    }

    const score = Math.min(
      100,
      items.reduce((sum, item) => sum + item.points, 0),
    );

    return {
      score,
      maxScore: 100,
      items,
    };
  }
}
