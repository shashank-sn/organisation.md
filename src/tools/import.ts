import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Octokit } from "octokit";
import { z } from "zod";
import { readFile, writeFile, createFile } from "../github/files.js";
import {
  getBranchRef, createBranch, generateBranchName,
  createPullRequest, createBlob, createTree, createCommit, updateBranch,
} from "../github/git.js";
import { parseDocument, getSection, replaceSection } from "../content/parser.js";

async function extractDocxText(content: string): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: Buffer.from(content, "base64") });
    return result.value;
  } catch {
    return content;
  }
}

function fileNameToSection(fileName: string): string {
  return fileName
    .replace(/\.(md|txt|docx)$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function registerImportTools(
  server: McpServer,
  octokit: Octokit,
  owner: string,
  repo: string,
  orgFilePath: string,
) {
  server.tool(
    "import_file",
    "import a file (txt, md, docx) into the repo as context. creates a context/ entry and updates the organisation.md index. the ai agent passes file content it has already read.",
    {
      fileName: z.string().describe("file name (e.g., 'onboarding.md', 'runbook.txt', 'spec.docx')"),
      content: z.string().describe("full text content of the file (plain text for txt/md, base64-encoded for docx)"),
      fileType: z.enum(["txt", "md", "docx"]).describe("file type — determines how content is processed"),
      section: z.string().optional().describe("which organisation.md section to link from (auto-detected from filename if omitted)"),
      message: z.string().optional().describe("brief description of what's being imported"),
    },
    {},
    async ({ fileName, content, fileType, section, message }) => {
      const commitMsg = message || `import ${fileName}`;
      const contextPath = `CONTEXT/${fileName}`;
      const importName = fileNameToSection(fileName);

      try {
        // Determine base branch
        let baseBranch = "main";
        try {
          await getBranchRef(octokit, owner, repo, "main");
        } catch {
          baseBranch = "master";
        }

        // Process content — extract text from docx, keep txt/md as-is
        let textContent = content;
        if (fileType === "docx") {
          textContent = await extractDocxText(content);
        }

        // Count sections in the imported content
        const headingRegex = /^#{1,3}\s+(.+)$/gm;
        let headingCount = 0;
        let match;
        while ((match = headingRegex.exec(textContent)) !== null) headingCount++;

        // Read current organisation.md
        let needsOrgUpdate = false;
        let orgUpdateContent = "";
        let orgFileSha = "";

        try {
          const orgFile = await readFile(octokit, owner, repo, orgFilePath);
          orgFileSha = orgFile.sha;
          const doc = parseDocument(orgFile.content);
          const targetSection = section || importName;
          const existingSection = getSection(doc, targetSection);

          if (existingSection) {
            const linkLine = `- **${importName}** — see [${fileName}](./${contextPath})`;
            orgUpdateContent = replaceSection(doc, targetSection, existingSection.content.trim() + "\n" + linkLine);
            needsOrgUpdate = true;
          }
        } catch {
          // organization.md doesn't exist yet or can't be read
        }

        // Create branch
        const baseRef = await getBranchRef(octokit, owner, repo, baseBranch);
        const branchName = generateBranchName();
        await createBranch(octokit, owner, repo, branchName, baseRef.sha);

        // Use git data API to create a single commit with both changes
        const treeEntries: Array<{ path: string; mode: "100644" | "100755" | "040000" | "160000" | "120000"; type: "blob" | "tree" | "commit"; sha: string | null }> = [];

        // Add the new CONTEXT/ file
        const contextBlobSha = await createBlob(octokit, owner, repo, textContent);
        treeEntries.push({
          path: contextPath,
          mode: "100644",
          type: "blob",
          sha: contextBlobSha,
        });

        // Add updated organisation.md if needed
        if (needsOrgUpdate && orgUpdateContent) {
          const orgBlobSha = await createBlob(octokit, owner, repo, orgUpdateContent);
          treeEntries.push({
            path: orgFilePath,
            mode: "100644",
            type: "blob",
            sha: orgBlobSha,
          });
        }

        // Create the tree and commit
        const treeSha = await createTree(octokit, owner, repo, baseRef.sha, treeEntries);
        const commitSha = await createCommit(octokit, owner, repo, commitMsg, treeSha, baseRef.sha);
        await updateBranch(octokit, owner, repo, branchName, commitSha);

        // Create PR
        let prBody = `## imported: \`${fileName}\`\n\n`;
        prBody += `**type:** ${fileType}\n`;
        prBody += `**path:** \`${contextPath}\`\n`;
        if (section) prBody += `**linked from:** \`${section}\`\n`;
        if (headingCount > 0) prBody += `**sections found:** ${headingCount}\n`;
        if (needsOrgUpdate) prBody += `\n_organisation.md index updated._\n`;
        prBody += `\n---\n_automated import via organisation.md mcp server._`;

        const pr = await createPullRequest(
          octokit, owner, repo,
          commitMsg.length > 72 ? commitMsg.substring(0, 69) + "..." : commitMsg,
          prBody,
          branchName,
          baseBranch,
        );

        const details = [
          `✅ imported \`${fileName}\` → \`${contextPath}\``,
          `📝 pr: ${pr.url}`,
        ];
        if (needsOrgUpdate) details.push(`📑 updated organisation.md with link to "${importName}"`);
        if (headingCount > 0) details.push(`📐 found ${headingCount} heading(s) in content`);

        return {
          content: [{ type: "text", text: details.join("\n") }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `error importing file: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },
  );
}
