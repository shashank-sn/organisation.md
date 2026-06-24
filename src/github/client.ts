import { Octokit } from "octokit";
import type { GitHubConfig } from "./types.js";
import { GitHubError } from "./types.js";

export function createGitHubClient(token: string, owner: string, repo: string): Octokit {
  return new Octokit({ auth: token });
}

export function getConfig(token: string, owner: string, repo: string): GitHubConfig {
  return { token, owner, repo };
}

export async function handleGitHubError<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error: unknown) {
    if (error instanceof GitHubError) throw error;
    if (typeof error === "object" && error !== null && "status" in error) {
      const apiError = error as { status: number; message?: string; response?: unknown };
      throw new GitHubError(
        apiError.message ?? "GitHub API error",
        apiError.status,
        apiError.response,
      );
    }
    throw new GitHubError(
      error instanceof Error ? error.message : "Unknown GitHub API error",
    );
  }
}
