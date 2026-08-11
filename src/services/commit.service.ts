import { GitService } from "./git.service.js";
import { AIService } from "./ai.service.js";
import { ScoreService } from "./score.service.js";
import {
  buildCommitPrompt,
  parseCommitCandidates,
} from "../prompts/commit.prompt.js";
import { validateConventionalCommit } from "../validators/conventional-commit.validator.js";
import { AppError } from "../utils/errors.js";
import type { CommitCandidate, GeneratedCommit } from "../types/commit.types.js";
import type { StagedAnalysis } from "../types/git.types.js";

export class CommitService {
  constructor(
    private readonly git: GitService = new GitService(),
    private readonly ai: AIService = new AIService(),
    private readonly scorer: ScoreService = new ScoreService(),
  ) {}

  async analyze(): Promise<StagedAnalysis> {
    return this.git.analyzeStagedChanges();
  }

  async requireStagedChanges(): Promise<StagedAnalysis> {
    const analysis = await this.analyze();
    if (analysis.files.length === 0) {
      throw new AppError(
        "No staged changes found. Stage files with `git add` first.",
        "NO_STAGED_CHANGES",
      );
    }
    return analysis;
  }

  enrichMessage(message: string): GeneratedCommit {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new AppError(
        "Commit message cannot be empty.",
        "EMPTY_MESSAGE",
      );
    }
    const validation = validateConventionalCommit(trimmed);
    const score = this.scorer.score(trimmed);
    return { message: trimmed, validation, score };
  }

  /**
   * Generate exactly 3 commit message candidates, each locally validated and scored.
   */
  async generateCommitCandidates(
    analysis?: StagedAnalysis,
  ): Promise<CommitCandidate[]> {
    const staged = analysis ?? (await this.requireStagedChanges());
    const prompt = buildCommitPrompt(staged);
    const response = await this.ai.generate(prompt, { temperature: 0.4 });
    const messages = parseCommitCandidates(response.text);

    return messages.map((message, index) => {
      const enriched = this.enrichMessage(message);
      return { index, ...enriched };
    });
  }

  /** @deprecated Prefer generateCommitCandidates. Returns the first candidate. */
  async generateCommitMessage(
    analysis?: StagedAnalysis,
  ): Promise<GeneratedCommit> {
    const candidates = await this.generateCommitCandidates(analysis);
    const first = candidates[0];
    if (!first) {
      throw new AppError(
        "AI returned an invalid empty commit message.",
        "INVALID_AI_RESPONSE",
      );
    }
    return {
      message: first.message,
      validation: first.validation,
      score: first.score,
    };
  }

  async createCommit(message: string): Promise<string> {
    return this.git.createCommit(message);
  }
}
