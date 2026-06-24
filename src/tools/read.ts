import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Octokit } from "octokit";
import { z } from "zod";
import { readFile } from "../github/files.js";
import { parseDocument, getSection } from "../content/parser.js";

export function registerReadTools(
  server: McpServer,
  octokit: Octokit,
  owner: string,
  repo: string,
  orgFilePath: string,
) {
  server.tool(
    "read_org",
    "Read the full organisation.md file from the GitHub repo.",
    {},
    { readOnlyHint: true },
    async () => {
      try {
        const file = await readFile(octokit, owner, repo, orgFilePath);
        return {
          content: [{ type: "text", text: file.content }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error reading organisation.md: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "read_section",
    "Read a specific section from organisation.md by heading name.",
    {
      section: z.string().describe("The section heading to read (e.g., 'Team', 'Identity')"),
    },
    { readOnlyHint: true },
    async ({ section }) => {
      try {
        const file = await readFile(octokit, owner, repo, orgFilePath);
        const doc = parseDocument(file.content);
        const found = getSection(doc, section);

        if (!found) {
          const headings = doc.sections.map((s) => s.heading).join(", ");
          return {
            content: [{ type: "text", text: `Section "${section}" not found. Available sections: ${headings}` }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: found.content }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error reading section: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );
}
