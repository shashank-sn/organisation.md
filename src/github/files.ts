import type { Octokit } from "octokit";
import type { FileContent, ContentItem } from "./types.js";
import { GitHubError } from "./types.js";
import { handleGitHubError } from "./client.js";
import { fileCache } from "../cache/index.js";

export async function readFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  ref?: string,
  useCache = true,
): Promise<FileContent> {
  // Check cache first
  if (useCache) {
    const cached = fileCache.get(path, ref ?? null);
    if (cached) {
      return { content: cached.content, sha: cached.sha, path: cached.path };
    }
  }

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

  const result: FileContent = {
    content: decoded,
    sha: data.sha,
    path: data.path,
  };

  // Cache the result
  if (useCache) {
    fileCache.set({
      content: result.content,
      sha: result.sha,
      path: result.path,
      ref: ref ?? null,
      cachedAt: Date.now(),
    });
  }

  return result;
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
  fileCache.invalidate(path);
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
  fileCache.invalidate(path);
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
