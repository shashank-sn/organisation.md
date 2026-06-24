import type { Octokit } from "octokit";
import { formatDecision } from "./formatter.js";
import { slugify } from "./parser.js";
import { today, uniquePath } from "./utils.js";
import { readFile, createFile } from "../github/files.js";
import {
  getBranchRef,
  createBranch,
  generateBranchName,
  createPullRequest,
} from "../github/git.js";
import { isGitHubHosted } from "../github/remote.js";

export interface AddDecisionInput {
  context: string;
  decision: string;
  rationale: string;
  alternatives: string;
  decided_by: string;
  related?: string[];
  slug?: string;
}

export interface AddDecisionResult {
  path: string;
  prUrl?: string;
  status: "proposed" | "direct";
}

export async function addDecision(
  octokit: Octokit,
  owner: string,
  repo: string,
  input: AddDecisionInput,
): Promise<AddDecisionResult> {
  const date = today();
  const slug = input.slug || slugify(input.decision);
  const path = await uniquePath(octokit, owner, repo, `CONTEXT/decisions/${date}-${slug}.md`);

  const content = formatDecision(
    {
      date,
      status: "proposed",
      type: "decision",
      decided_by: input.decided_by,
      related: input.related ?? [],
      body: {
        context: input.context,
        decision: input.decision,
        rationale: input.rationale,
        alternatives: input.alternatives,
      },
    },
    slug,
    date,
  );

  if (await isGitHubHosted(octokit, owner, repo)) {
    return addDecisionViaPr(octokit, owner, repo, path, content, input.decision);
  } else {
    return addDecisionDirect(octokit, owner, repo, path, content);
  }
}

async function addDecisionViaPr(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  content: string,
  decisionTitle: string,
): Promise<AddDecisionResult> {
  let baseBranch = "main";
  try {
    await getBranchRef(octokit, owner, repo, "main");
  } catch (error) {
    const err = error as { status?: number };
    // Only fall through to master on 404 — rethrow auth/server errors
    if (err.status !== 404) throw error;
    baseBranch = "master";
  }

  const baseRef = await getBranchRef(octokit, owner, repo, baseBranch);
  const branchName = `memory/decision/${Date.now()}`;

  await createBranch(octokit, owner, repo, branchName, baseRef.sha);
  await createFile(octokit, owner, repo, path, content, branchName, `feat: add decision — ${decisionTitle.substring(0, 72)}`);

  const pr = await createPullRequest(
    octokit, owner, repo,
    `Decision: ${decisionTitle.substring(0, 72)}`,
    `## Decision\n\n**Path:** \`${path}\`\n\n**Context:**\n> ${content.includes("## Context") ? content.split("## Context")[1]?.split("##")[0]?.trim()?.substring(0, 200) : ""}\n\n_Automated decision capture from organisation.md MCP server._`,
    branchName,
    baseBranch,
  );

  return { path, prUrl: pr.url, status: "proposed" };
}

async function addDecisionDirect(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  content: string,
): Promise<AddDecisionResult> {
  await createFile(
    octokit, owner, repo,
    path,
    content,
    "main",
    `feat(decision): add decision — ${path}`,
  );

  return { path, status: "direct" };
}
