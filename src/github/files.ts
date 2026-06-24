import type { Octokit } from "octokit";
import type { FileContent, ContentItem } from "./types.js";
import { GitHubError } from "./types.js";
import { handleGitHubError } from "./client.js";

export async function readFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<FileContent> {
  const response = await handleGitHubError(
    octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ...(ref ? { ref } : {}),
    }),
  );

  const data = response.data as { type: string; content?: string; sha: string; path: string };

  if (data.type !== "file" || !data.content) {
    throw new GitHubError(`Path is not a file: ${path}`);
  }

  const decoded = Buffer.from(data.content, "base64").toString("utf-8");

  return {
    content: decoded,
    sha: data.sha,
    path: data.path,
  };
}

export async function writeFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  content: string,
  sha: string,
  branch: string,
  message: string,
): Promise<void> {
  await handleGitHubError(
    octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content, "utf-8").toString("base64"),
      sha,
      branch,
    }),
  );
}

export async function createFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  content: string,
  branch: string,
  message: string,
): Promise<void> {
  await handleGitHubError(
    octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content, "utf-8").toString("base64"),
      branch,
    }),
  );
}

export async function listDirectory(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<ContentItem[]> {
  const response = await handleGitHubError(
    octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ...(ref ? { ref } : {}),
    }),
  );

  const data = response.data as Array<{ name: string; path: string; type: string }>;

  return data.map((item) => ({
    name: item.name,
    path: item.path,
    type: item.type as "file" | "dir",
  }));
}
