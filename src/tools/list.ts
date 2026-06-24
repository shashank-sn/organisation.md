import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Octokit } from "octokit";
import { listDirectory } from "../github/files.js";

export function registerListTools(
  server: McpServer,
  octokit: Octokit,
  owner: string,
  repo: string,
) {
  server.tool(
    "list_context_files",
    "List all files in the CONTEXT/ directory of the repo.",
    {},
    { readOnlyHint: true },
    async () => {
      try {
        const files = await listDirectory(octokit, owner, repo, "CONTEXT");

        if (files.length === 0) {
          return {
            content: [{ type: "text", text: "The CONTEXT/ directory is empty or does not exist." }],
          };
        }

        const formatted = files.map((f) =>
          `- ${f.name} (${f.type === "dir" ? "directory" : "file"})`
        ).join("\n");

        return {
          content: [{ type: "text", text: `Files in CONTEXT/:\n${formatted}` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error listing context files: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );
}
