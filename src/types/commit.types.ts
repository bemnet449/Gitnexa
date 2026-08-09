import type { ConventionalType } from "../config/constants.js";

export interface ValidationResult {
  valid: boolean;
  type: ConventionalType | null;
  scope: string | null;
  description: string | null;
  reasons: string[];
}

export interface ScoreBreakdownItem {
  label: string;
  passed: boolean;
  points: number;
}

export interface ScoreResult {
  score: number;
  maxScore: number;
  items: ScoreBreakdownItem[];
}

export interface GeneratedCommit {
  message: string;
  validation: ValidationResult;
  score: ScoreResult;
}
