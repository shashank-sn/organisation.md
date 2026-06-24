import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Octokit } from "octokit";
import { z } from "zod";
import { readFile } from "../github/files.js";
import { writeFile } from "../github/files.js";
import { parseDocument, replaceSection } from "../content/parser.js";
import { getBranchRef, createBranch, generateBranchName, createPullRequest } from "../github/git.js";

export function registerWriteTools(
  server: McpServer,
  octokit: Octokit,
  owner: string,
  repo: string,
  orgFilePath: string,
) {
  server.tool(
    "update_section",
    "Propose an update to a section in organisation.md. Creates a pull request for review.",
    {
      section: z.string().describe("The section heading to update"),
      content: z.string().describe("The new content for this section"),
      message: z.string().describe("A brief description of what changed and why"),
    },
    {},
    async ({ section, content, message }) => {
      try {
        const file = await readFile(octokit, owner, repo, orgFilePath);
        const doc = parseDocument(file.content);
        const updated = replaceSection(doc, section, content);

        let baseBranch = "main";
        try {
          await getBranchRef(octokit, owner, repo, "main");
        } catch {
          baseBranch = "master";
        }

        const baseRef = await getBranchRef(octokit, owner, repo, baseBranch);
        const branchName = generateBranchName();

        await createBranch(octokit, owner, repo, branchName, baseRef.sha);
        await writeFile(octokit, owner, repo, orgFilePath, updated, file.sha, branchName, `update(${section}): ${message}`);

        const pr = await createPullRequest(
          octokit, owner, repo,
          `Update ${section}: ${message}`,
          `Proposed update to the **${section}** section.\n\n> ${message}\n\n_Automated proposal from organisation.md MCP server._`,
          branchName,
          baseBranch,
        );

        return {
          content: [{ type: "text", text: `Pull request created: ${pr.url}` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error updating section: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );
}
