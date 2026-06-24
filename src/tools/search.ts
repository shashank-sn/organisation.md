import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Octokit } from "octokit";
import { z } from "zod";
import { readFile, listDirectory } from "../github/files.js";
import { parseDocument } from "../content/parser.js";

export function registerSearchTools(
  server: McpServer,
  octokit: Octokit,
  owner: string,
  repo: string,
) {
  server.tool(
    "search_context",
    "Search across organisation.md and CONTEXT/ files for matching text.",
    {
      query: z.string().describe("Search term to find across context files"),
    },
    { readOnlyHint: true },
    async ({ query }) => {
      try {
        const results: Array<{ file: string; section: string; snippet: string }> = [];
        const lowerQuery = query.toLowerCase();

        // Search organisation.md
        try {
          const orgFile = await readFile(octokit, owner, repo, "organisation.md");
          const doc = parseDocument(orgFile.content);

          for (const section of doc.sections) {
            if (section.content.toLowerCase().includes(lowerQuery)) {
              const lines = section.content.split("\n").filter((l) => l.trim());
              const snippet = lines.slice(0, 5).join("\n").substring(0, 300);
              results.push({ file: "organisation.md", section: section.heading, snippet });
            }
          }
        } catch {
          // organisation.md might not exist yet
        }

        // Search CONTEXT/ files
        try {
          const files = await listDirectory(octokit, owner, repo, "CONTEXT");
          for (const file of files) {
            if (file.type !== "file") continue;
            try {
              const content = await readFile(octokit, owner, repo, file.path);
              if (content.content.toLowerCase().includes(lowerQuery)) {
                const lines = content.content.split("\n").filter((l) => l.trim());
                const snippet = lines.slice(0, 5).join("\n").substring(0, 300);
                results.push({ file: file.path, section: "", snippet });
              }
            } catch {
              // Skip files that can't be read
            }
          }
        } catch {
          // CONTEXT/ directory might not exist
        }

        if (results.length === 0) {
          return {
            content: [{ type: "text", text: `No matches found for "${query}".` }],
          };
        }

        const formatted = results.map((r) =>
          `**${r.file}**${r.section ? ` → ${r.section}` : ""}:\n\`\`\`\n${r.snippet}\n\`\`\``
        ).join("\n\n");

        return {
          content: [{ type: "text", text: `Found ${results.length} match(es) for "${query}":\n\n${formatted}` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error searching context: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );
}
