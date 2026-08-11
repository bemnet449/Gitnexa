export interface RepoInfo {
  root: string;
  name: string;
  branch: string;
  isClean: boolean;
}

export interface StagedFile {
  path: string;
  indexStatus: string;
  workingTreeStatus: string;
}

export interface DiffStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface StagedAnalysis {
  repo: RepoInfo;
  files: StagedFile[];
  diff: string;
  stats: DiffStats;
  summaryLines: string[];
}

export interface CommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  body: string;
}

export interface CommitChangeFile {
  path: string;
  status: string;
}

export interface CommitDetails {
  commit: CommitInfo;
  diff: string;
  files: CommitChangeFile[];
  stats: DiffStats;
  diffTruncated: boolean;
}
