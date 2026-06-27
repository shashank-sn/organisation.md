import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Octokit } from "octokit";
import { z } from "zod";
import { readFile, writeFile, createFile } from "../github/files.js";
import { getBranchRef, createBranch, generateBranchName, createPullRequest } from "../github/git.js";

export function registerProposeTools(
  server: McpServer,
  octokit: Octokit,
  owner: string,
  repo: string,
) {
  server.tool(
    "propose_change",
    "Propose a change to any file in the organisation.md repo. Creates a pull request.",
    {
      path: z.string().describe("File path relative to repo root (e.g., 'CONTEXT/projects.md')"),
      content: z.string().describe("New content for the file"),
      message: z.string().describe("Commit message describing the change"),
    },
    {},
    async ({ path, content, message }) => {
      try {
        let baseBranch = "main";
        try {
          await getBranchRef(octokit, owner, repo, "main");
        } catch {
          baseBranch = "master";
        }

        const baseRef = await getBranchRef(octokit, owner, repo, baseBranch);
        const branchName = generateBranchName();

        await createBranch(octokit, owner, repo, branchName, baseRef.sha);

        let fileSha: string | undefined;
        try {
          const existing = await readFile(octokit, owner, repo, path);
          fileSha = existing.sha;
        } catch {
          // File doesn't exist yet — will be created
        }

        if (fileSha) {
          await writeFile(octokit, owner, repo, path, content, fileSha, branchName, message);
        } else {
          await createFile(octokit, owner, repo, path, content, branchName, message);
        }

        const pr = await createPullRequest(
          octokit, owner, repo,
          message.length > 72 ? message.substring(0, 69) + "..." : message,
          `Proposed change to \`${path}\`.\n\n> ${message}\n\n_Automated proposal from organisation.md MCP server._`,
          branchName,
          baseBranch,
        );

        return {
          content: [{ type: "text", text: `Pull request created: ${pr.url}` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error proposing change: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );
}
