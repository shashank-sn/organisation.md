import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Octokit } from "octokit";
import { z } from "zod";
import { searchMemory } from "../memory/search.js";

export function registerSearchTools(
  server: McpServer,
  octokit: Octokit,
  owner: string,
  repo: string,
) {
  server.tool(
    "search_context",
    "Search across organisation.md, CONTEXT/ files, decisions, sessions, and events for matching text. Supports frontmatter field filtering.",
    {
      query: z.string().describe("Search term to find across all context files"),
      status: z.string().optional().describe("Filter by status (e.g., 'proposed', 'accepted', 'superseded')"),
      type: z.string().optional().describe("Filter by entry type (e.g., 'decision', 'session', 'milestone', 'incident')"),
      date_from: z.string().optional().describe("Filter by start date (YYYY-MM-DD)"),
      date_to: z.string().optional().describe("Filter by end date (YYYY-MM-DD)"),
      search_in: z.array(z.enum(["org", "context", "decisions", "sessions", "events"])).optional().describe("Which stores to search (defaults to all)"),
    },
    { readOnlyHint: true },
    async ({ query, status, type, date_from, date_to, search_in }) => {
      try {
        const results = await searchMemory(octokit, owner, repo, {
          query,
          status,
          type,
          date_from,
          date_to,
          search_in,
        });

        if (results.length === 0) {
          return {
            content: [{ type: "text", text: `No matches found for "${query}".` }],
          };
        }

        const formatted = results.map((r) =>
          `**${r.file}**${r.title ? ` → ${r.title}` : ""}${r.status ? ` (${r.status})` : ""}:\n\`\`\`\n${r.snippet}\n\`\`\``
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
