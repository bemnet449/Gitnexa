import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { GitService } from "./git.service.js";
import { AIService } from "./ai.service.js";
import { ScoreService } from "./score.service.js";
import {
  buildCommitPrompt,
  parseCommitMessageResponse,
} from "../prompts/commit.prompt.js";
import { validateConventionalCommit } from "../validators/conventional-commit.validator.js";
import { AppError } from "../utils/errors.js";
import type { GeneratedCommit } from "../types/commit.types.js";
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

  async generateCommitMessage(
    analysis?: StagedAnalysis,
  ): Promise<GeneratedCommit> {
    const staged = analysis ?? (await this.requireStagedChanges());
    const prompt = buildCommitPrompt(staged);
    const response = await this.ai.generate(prompt, { temperature: 0.2 });
    const message = parseCommitMessageResponse(response.text);

    if (!message) {
      throw new AppError(
        "AI returned an invalid empty commit message.",
        "INVALID_AI_RESPONSE",
      );
    }

    const validation = validateConventionalCommit(message);
    const score = this.scorer.score(message);

    return { message, validation, score };
  }

  async confirm(question: string): Promise<boolean> {
    const rl = readline.createInterface({ input, output });
    try {
      const answer = (await rl.question(question)).trim().toLowerCase();
      if (!answer || answer === "y" || answer === "yes") {
        return true;
      }
      return false;
    } finally {
      rl.close();
    }
  }

  async createCommit(message: string): Promise<string> {
    return this.git.createCommit(message);
  }

  async runCommitWorkflow(options: {
    onAnalyzing?: () => void;
    onAnalyzed?: (analysis: StagedAnalysis) => void;
    onGenerating?: () => void;
    onGenerated?: (result: GeneratedCommit) => void;
    skipConfirm?: boolean;
  } = {}): Promise<{ committed: boolean; hash?: string; message: string }> {
    options.onAnalyzing?.();
    const analysis = await this.requireStagedChanges();
    options.onAnalyzed?.(analysis);

    options.onGenerating?.();
    const generated = await this.generateCommitMessage(analysis);
    options.onGenerated?.(generated);

    if (!options.skipConfirm) {
      const confirmed = await this.confirm("Create this commit? (Y/n) ");
      if (!confirmed) {
        return { committed: false, message: generated.message };
      }
    }

    const hash = await this.createCommit(generated.message);
    return { committed: true, hash, message: generated.message };
  }
}
