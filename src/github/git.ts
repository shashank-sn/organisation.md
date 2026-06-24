import type { Octokit } from "octokit";
import type { BranchRef, CreatePrResult } from "./types.js";
import { GitHubError } from "./types.js";
import { handleGitHubError } from "./client.js";

export async function getDefaultBranchSha(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<string> {
  const response = await handleGitHubError(
    octokit.rest.repos.get({ owner, repo }),
  );
  return response.data.default_branch;
}

export async function getBranchRef(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
): Promise<BranchRef> {
  const response = await handleGitHubError(
    octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    }),
  );

  return {
    name: branch,
    sha: response.data.object.sha,
  };
}

export async function createBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  newBranch: string,
  fromSha: string,
): Promise<BranchRef> {
  const response = await handleGitHubError(
    octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${newBranch}`,
      sha: fromSha,
    }),
  );

  return {
    name: newBranch,
    sha: response.data.object.sha,
  };
}

export async function createBlob(
  octokit: Octokit,
  owner: string,
  repo: string,
  content: string,
): Promise<string> {
  const response = await handleGitHubError(
    octokit.rest.git.createBlob({
      owner,
      repo,
      content,
      encoding: "utf-8",
    }),
  );

  return response.data.sha;
}

export async function createTree(
  octokit: Octokit,
  owner: string,
  repo: string,
  baseTreeSha: string | undefined,
  tree: Array<{ path: string; mode: "100644" | "100755" | "040000" | "160000" | "120000"; type: "blob" | "tree" | "commit"; sha: string | null }>,
): Promise<string> {
  const response = await handleGitHubError(
    octokit.rest.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree,
    }),
  );

  return response.data.sha;
}

export async function createCommit(
  octokit: Octokit,
  owner: string,
  repo: string,
  message: string,
  treeSha: string,
  parentSha: string,
): Promise<string> {
  const response = await handleGitHubError(
    octokit.rest.git.createCommit({
      owner,
      repo,
      message,
      tree: treeSha,
      parents: [parentSha],
    }),
  );

  return response.data.sha;
}

export async function updateBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  commitSha: string,
): Promise<void> {
  await handleGitHubError(
    octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commitSha,
      force: false,
    }),
  );
}

export async function createPullRequest(
  octokit: Octokit,
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string,
): Promise<CreatePrResult> {
  const response = await handleGitHubError(
    octokit.rest.pulls.create({
      owner,
      repo,
      title,
      body,
      head,
      base,
    }),
  );

  return {
    url: response.data.html_url,
    number: response.data.number,
  };
}

export function generateBranchName(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `proposal/${timestamp}-${random}`;
}
