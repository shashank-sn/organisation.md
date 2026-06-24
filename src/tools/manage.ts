import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Octokit } from "octokit";
import { z } from "zod";
import { readFile } from "../github/files.js";
import {
  getBranchRef, createBranch, generateBranchName,
  createPullRequest, createBlob, createTree, createCommit, updateBranch,
} from "../github/git.js";
import { parseDocument, getSection, replaceSection } from "../content/parser.js";

function findBestSection(text: string): string | null {
  const content = text.toLowerCase();
  const sectionHints: Record<string, string[]> = {
    "identity": ["org name", "company name", "description", "we are", "our purpose"],
    "mission & vision": ["mission", "vision", "goal", "aspiration", "north star"],
    "team": ["team", "member", "role", "person", "hire", "engineer", "manager"],
    "active projects": ["project", "initiative", "epic", "milestone", "sprint"],
    "decisions": ["decision", "we decided", "architectural decision record", "adr"],
    "preferences": ["prefer", "like", "preference", "convention", "style"],
    "routines": ["routine", "process", "workflow", "meeting", "standup"],
    "glossary": ["term", "definition", "acronym"],
  };

  let bestSection = "decisions";
  let bestScore = 0;

  for (const [section, hints] of Object.entries(sectionHints)) {
    const score = hints.filter((h) => content.includes(h)).length;
    if (score > bestScore) {
      bestScore = score;
      bestSection = section;
    }
  }

  return bestSection;
}

export function registerManageTools(
  server: McpServer,
  octokit: Octokit,
  owner: string,
  repo: string,
  orgFilePath: string,
) {
  server.tool(
    "add_info",
    "add information to the knowledge base using natural language. describes what to add, and the tool figures out which section and file to put it in.",
    {
      info: z.string().describe("the information to add, in natural language (e.g., 'our new project is called veridian, led by alice, focused on data pipelines')"),
      source: z.string().optional().describe("optional source reference (e.g., 'meeting notes 2025-06-20', 'slack thread')"),
      section: z.string().optional().describe("specific section to add to (auto-detected if omitted)"),
    },
    {},
    async ({ info, source, section }) => {
      try {
        const targetSection = section || findBestSection(info) || "decisions";
        const timestamp = new Date().toISOString().split("T")[0];
        const sourceLine = source ? `> source: ${source} (${timestamp})` : `> added: ${timestamp}`;

        // Read the org file
        const orgFile = await readFile(octokit, owner, repo, orgFilePath);
        const doc = parseDocument(orgFile.content);

        // Check if section exists
        let existingSection = getSection(doc, targetSection);

        if (existingSection) {
          // Append to existing section
          const newContent = existingSection.content.trim() + "\n\n" + sourceLine + "\n" + info;
          const updated = replaceSection(doc, targetSection, newContent);

          // Create PR
          let baseBranch = "main";
          try { await getBranchRef(octokit, owner, repo, "main"); } catch { baseBranch = "master"; }
          const baseRef = await getBranchRef(octokit, owner, repo, baseBranch);
          const branchName = generateBranchName();
          await createBranch(octokit, owner, repo, branchName, baseRef.sha);

          const blobSha = await createBlob(octokit, owner, repo, updated);
          const treeSha = await createTree(octokit, owner, repo, baseRef.sha, [
            { path: orgFilePath, mode: "100644", type: "blob", sha: blobSha },
          ]);
          const commitSha = await createCommit(octokit, owner, repo, `add info to ${targetSection}: ${info.substring(0, 60)}`, treeSha, baseRef.sha);
          await updateBranch(octokit, owner, repo, branchName, commitSha);

          const pr = await createPullRequest(
            octokit, owner, repo,
            `add: ${info.substring(0, 60)}${info.length > 60 ? "..." : ""}`,
            `## added to: ${targetSection}\n\n${sourceLine}\n\n${info}\n\n---\n_automated via organisation.md mcp server._`,
            branchName, baseBranch,
          );

          return { content: [{ type: "text", text: `✅ added to **${targetSection}**\n📝 pr: ${pr.url}` }] };
        } else {
          // Create new section
          const newSectionContent = `\n\n${sourceLine}\n${info}`;
          const updated = doc.raw.trim() + `\n\n## ${targetSection}\n\n${newSectionContent}\n`;

          let baseBranch = "main";
          try { await getBranchRef(octokit, owner, repo, "main"); } catch { baseBranch = "master"; }
          const baseRef = await getBranchRef(octokit, owner, repo, baseBranch);
          const branchName = generateBranchName();
          await createBranch(octokit, owner, repo, branchName, baseRef.sha);

          const blobSha = await createBlob(octokit, owner, repo, updated);
          const treeSha = await createTree(octokit, owner, repo, baseRef.sha, [
            { path: orgFilePath, mode: "100644", type: "blob", sha: blobSha },
          ]);
          const commitSha = await createCommit(octokit, owner, repo, `add new section "${targetSection}": ${info.substring(0, 60)}`, treeSha, baseRef.sha);
          await updateBranch(octokit, owner, repo, branchName, commitSha);

          const pr = await createPullRequest(
            octokit, owner, repo,
            `add: new section "${targetSection}" — ${info.substring(0, 50)}${info.length > 50 ? "..." : ""}`,
            `## new section: ${targetSection}\n\n${sourceLine}\n\n${info}\n\n---\n_automated via organisation.md mcp server._`,
            branchName, baseBranch,
          );

          return { content: [{ type: "text", text: `✅ created new section **${targetSection}**\n📝 pr: ${pr.url}` }] };
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `error adding info: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "remove_info",
    "remove information from the knowledge base using natural language. describes what to remove, and the tool finds and removes it.",
    {
      query: z.string().describe("description of what to remove (e.g., 'remove the project veridian entry', 'delete alice from team')"),
      section: z.string().optional().describe("limit removal to a specific section"),
    },
    {},
    async ({ query, section }) => {
      try {
        const orgFile = await readFile(octokit, owner, repo, orgFilePath);
        const doc = parseDocument(orgFile.content);

        const sectionsToSearch: Array<{ heading: string; content: string; startLine: number; endLine: number }> = section
          ? (() => {
              const found = getSection(doc, section);
              return found ? [found] : [];
            })()
          : doc.sections;

        if (sectionsToSearch.length === 0) {
          return {
            content: [{ type: "text", text: section
              ? `section "${section}" not found.`
              : "no sections found in organisation.md." }],
            isError: true,
          };
        }

        // Build an updated document by removing matching content from sections
        const queryLower = query.toLowerCase();
        let updated = orgFile.content;
        let removedCount = 0;
        const affectedSections: string[] = [];

        for (const s of sectionsToSearch) {
          const sectionContent = s.content;
          const lines = sectionContent.split("\n");
          const filteredLines = lines.filter((line) => {
            const shouldKeep = !line.toLowerCase().includes(queryLower);
            if (!shouldKeep) removedCount++;
            return shouldKeep;
          });

          if (filteredLines.length !== lines.length) {
            const newContent = filteredLines.join("\n").trim();
            updated = replaceSection(doc, s.heading, newContent || "(empty)");
            affectedSections.push(s.heading);
          }
        }

        if (removedCount === 0) {
          return {
            content: [{ type: "text", text: `no content matching "${query}" was found.` }],
            isError: true,
          };
        }

        // Create PR
        let baseBranch = "main";
        try { await getBranchRef(octokit, owner, repo, "main"); } catch { baseBranch = "master"; }
        const baseRef = await getBranchRef(octokit, owner, repo, baseBranch);
        const branchName = generateBranchName();
        await createBranch(octokit, owner, repo, branchName, baseRef.sha);

        const blobSha = await createBlob(octokit, owner, repo, updated);
        const treeSha = await createTree(octokit, owner, repo, baseRef.sha, [
          { path: orgFilePath, mode: "100644", type: "blob", sha: blobSha },
        ]);
        const commitSha = await createCommit(octokit, owner, repo, `remove: ${query.substring(0, 60)}`, treeSha, baseRef.sha);
        await updateBranch(octokit, owner, repo, branchName, commitSha);

        const pr = await createPullRequest(
          octokit, owner, repo,
          `remove: ${query.substring(0, 60)}${query.length > 60 ? "..." : ""}`,
          `## removed content matching: "${query}"\n\naffected sections:\n${affectedSections.map((s) => `- ${s}`).join("\n")}\n\n**lines removed:** ${removedCount}\n\n---\n_automated via organisation.md mcp server._`,
          branchName, baseBranch,
        );

        return {
          content: [{ type: "text", text: `✅ removed ${removedCount} line(s) matching "${query}"\n📝 pr: ${pr.url}\n📑 affected: ${affectedSections.join(", ")}` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `error removing info: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );
}
