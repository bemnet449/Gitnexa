import { GitService } from "./git.service.js";
import type { CommitInfo } from "../types/git.types.js";
import { DEFAULT_HISTORY_LIMIT } from "../config/constants.js";

export class HistoryService {
  constructor(private readonly git: GitService = new GitService()) {}

  async getRecent(limit: number = DEFAULT_HISTORY_LIMIT): Promise<CommitInfo[]> {
    return this.git.getRecentCommits(limit);
  }
}
