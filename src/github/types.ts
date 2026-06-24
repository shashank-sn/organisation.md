export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export interface FileContent {
  content: string;
  sha: string;
  path: string;
}

export interface BranchRef {
  name: string;
  sha: string;
}

export interface CreatePrResult {
  url: string;
  number: number;
}

export interface ContentItem {
  name: string;
  path: string;
  type: "file" | "dir";
}

export class GitHubError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}
