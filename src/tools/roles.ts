import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Octokit } from "octokit";
import { z } from "zod";
import { handleGitHubError } from "../github/client.js";
import { readFile, writeFile, createFile } from "../github/files.js";
import {
  getBranchRef, createBranch, generateBranchName,
  createPullRequest, createBlob, createTree, createCommit, updateBranch,
} from "../github/git.js";

export function registerRoleTools(
  server: McpServer,
  octokit: Octokit,
  owner: string,
  repo: string,
) {
  server.tool(
    "check_roles",
    "check who has what permissions on this repo. reads the codeowners file and current collaborator permissions.",
    {
      user: z.string().optional().describe("check permissions for a specific github username"),
    },
    { readOnlyHint: true },
    async ({ user }) => {
      try {
        // Get authenticated user
        const authUser = await handleGitHubError(
          octokit.rest.users.getAuthenticated(),
        );
        const username = user || authUser.data.login;

        // Check user's permission level
        let permission = "none";
        try {
          const collab = await handleGitHubError(
            octokit.rest.repos.getCollaboratorPermissionLevel({
              owner,
              repo,
              username,
            }),
          );
          permission = collab.data.permission;
        } catch {
          permission = "read (public repo)";
        }

        // Get collaborators
        const collaborators = await handleGitHubError(
          octokit.rest.repos.listCollaborators({ owner, repo }),
        );

        const collabList = collaborators.data
          .filter((c) => c.permissions)
          .map((c) => ({
            login: c.login,
            permission: c.permissions?.admin
              ? "admin"
              : c.permissions?.push
                ? "write"
                : "read",
          }));

        // Try to read CODEOWNERS
        let codeowners = "not found";
        try {
          const co = await readFile(octokit, owner, repo, ".github/CODEOWNERS");
          codeowners = co.content;
        } catch {
          // CODEOWNERS not set up
        }

        // Build role report
        const self = collabList.find((c) => c.login === authUser.data.login);
        const adminCount = collabList.filter((c) => c.permission === "admin").length;
        const writeCount = collabList.filter((c) => c.permission === "write").length;
        const readCount = collabList.filter((c) => c.permission === "read").length;

        let report = `## roles for ${owner}/${repo}\n\n`;
        report += `**you are:** ${authUser.data.login} (${permission})\n\n`;
        report += `**collaborators:** ${collabList.length} total\n`;
        report += `- admins: ${adminCount}\n`;
        report += `- write: ${writeCount}\n`;
        report += `- read:  ${readCount}\n\n`;

        if (self) {
          report += `**your permission:** \`${self.permission}\`\n`;
          report += `you can: ${self.permission === "admin" ? "add/delete/approve/merge" : self.permission === "write" ? "push branches, create prs" : "view and fork"}\n\n`;
        }

        report += `### codeowners\n\n`;
        report += "```\n" + codeowners + "\n```\n\n";
        report += `to set up branch protection: github.com/${owner}/${repo}/settings/branches\n`;
        report += `edit codeowners: github.com/${owner}/${repo}/blob/main/.github/CODEOWNERS`;

        return {
          content: [{ type: "text", text: report }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `error checking roles: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "configure_codeowners",
    "update the .github/codeowners file to define who can approve changes to specific paths.",
    {
      pattern: z.string().describe("path pattern (e.g., 'organisation.md', 'CONTEXT/', '*.md')"),
      owners: z.string().describe("github usernames or team names, space-separated (e.g., '@alice @bob' or '@org/team')"),
      message: z.string().optional().describe("description of why this ownership is being added/changed"),
    },
    {},
    async ({ pattern, owners, message }) => {
      const commitMsg = message || `set codeowners: ${pattern} → ${owners}`;

      try {

        let baseBranch = "main";
        try { await getBranchRef(octokit, owner, repo, "main"); } catch { baseBranch = "master"; }
        const baseRef = await getBranchRef(octokit, owner, repo, baseBranch);
        const branchName = generateBranchName();
        await createBranch(octokit, owner, repo, branchName, baseRef.sha);

        let existingCodeowners = "";
        let exists = false;
        try {
          const co = await readFile(octokit, owner, repo, ".github/CODEOWNERS");
          existingCodeowners = co.content;
          exists = true;
        } catch {
          // doesn't exist yet
        }

        // Add or update the line
        const header = "# organisation.md — manage who can approve changes to paths\n";
        const lines = existingCodeowners ? existingCodeowners.split("\n") : [header, "", "# syntax: <pattern> @owner1 @owner2", ""];
        const existingIdx = lines.findIndex((l) => l.trim().startsWith(pattern));
        const newLine = `${pattern} ${owners}`;

        if (existingIdx >= 0) {
          lines[existingIdx] = newLine;
        } else {
          lines.push(newLine);
        }

        const newContent = lines.join("\n");

        if (exists) {
          await writeFile(octokit, owner, repo, ".github/CODEOWNERS", newContent, "", branchName, commitMsg);
        } else {
          await createFile(octokit, owner, repo, ".github/CODEOWNERS", newContent, branchName, commitMsg);
        }

        const pr = await createPullRequest(
          octokit, owner, repo,
          `codeowners: ${pattern} → ${owners}`,
          `## codeowners update\n\n**pattern:** \`${pattern}\`\n**owners:** ${owners}\n\n${message ? `> ${message}\n` : ""}\n---\n_automated via organisation.md mcp server._`,
          branchName, baseBranch,
        );

        return {
          content: [{ type: "text", text: `✅ codeowners updated\n📝 pr: ${pr.url}` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `error updating codeowners: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "check_permissions",
    "check if the current user can perform a specific action (add, delete, approve, merge).",
    {
      action: z.enum(["add", "delete", "approve", "merge"]).describe("the action to check"),
      path: z.string().optional().describe("optional file path to check permissions against codeowners pattern"),
    },
    { readOnlyHint: true },
    async ({ action, path }) => {
      try {
        const authUser = await handleGitHubError(
          octokit.rest.users.getAuthenticated(),
        );

        const collab = await handleGitHubError(
          octokit.rest.repos.getCollaboratorPermissionLevel({
            owner, repo, username: authUser.data.login,
          }),
        );

        const permission = collab.data.permission;

        // Permission hierarchy: admin > write > read > none
        const permLevels: Record<string, number> = {
          admin: 4,
          write: 3,
          triage: 2,
          read: 1,
          none: 0,
        };

        const userLevel = permLevels[permission] || 0;

        // What level is needed for each action
        const actionLevels: Record<string, number> = {
          add: 2, // triage+ can add
          delete: 3, // write+ can delete
          approve: 3, // write+ can approve (CODEOWNERS refines this)
          merge: 4, // admin only for merge
        };

        const requiredLevel = actionLevels[action] || 3;
        const canDo = userLevel >= requiredLevel;

        let msg = `**${authUser.data.login}** — \`${permission}\`\n\n`;
        msg += `action: **${action}**\n`;
        msg += `required: ${Object.keys(permLevels).find((k) => permLevels[k] === requiredLevel)}\n`;
        msg += `result: **${canDo ? "✅ allowed" : "❌ denied"}**\n`;

        if (path) {
          msg += `\npath: \`${path}\`\n`;
          msg += `note: codeowners may require specific reviewers for this path\n`;
        }

        return {
          content: [{ type: "text", text: msg }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `error checking permissions: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );
}
