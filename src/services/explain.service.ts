import { GitService } from "./git.service.js";
import { AIService } from "./ai.service.js";
import {
  buildExplainPrompt,
  parseExplainResponse,
} from "../prompts/explain.prompt.js";
import { MAX_DIFF_CHARS } from "../config/constants.js";
import { AppError } from "../utils/errors.js";
import type { CommitDetails } from "../types/git.types.js";

export interface ExplainResult {
  details: CommitDetails;
  explanation: string;
}

export class ExplainService {
  constructor(
    private readonly git: GitService = new GitService(),
    private readonly ai: AIService = new AIService(),
  ) {}

  async ensureRepository(): Promise<void> {
    await this.git.ensureRepository();
  }

  async getRecentCommits(limit = 15) {
    const commits = await this.git.getRecentCommits(limit);
    if (commits.length === 0) {
      throw new AppError(
        "No commits found in this repository.",
        "NO_COMMITS",
      );
    }
    return commits;
  }

  async loadCommitDetails(ref: string): Promise<CommitDetails> {
    const details = await this.git.getCommitDetails(ref);
    const diffTruncated = details.diff.length > MAX_DIFF_CHARS;
    return {
      ...details,
      diffTruncated,
    };
  }

  async explainCommit(ref: string): Promise<ExplainResult> {
    const details = await this.loadCommitDetails(ref);
    const prompt = buildExplainPrompt(details.commit, details.diff, {
      truncated: details.diffTruncated,
    });
    const response = await this.ai.generate(prompt, { temperature: 0.3 });
    const explanation = parseExplainResponse(response.text);

    if (!explanation) {
      throw new AppError(
        "AI returned an empty explanation. Try again.",
        "EMPTY_AI_RESPONSE",
      );
    }

    return { details, explanation };
  }
}
