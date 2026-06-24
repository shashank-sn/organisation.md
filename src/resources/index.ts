import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Octokit } from "octokit";
import { readFile } from "../github/files.js";
import { parseDocument, getSection } from "../content/parser.js";

const SECTION_NAMES = [
  "Identity",
  "Mission & Vision",
  "Team",
  "Active Projects",
  "Decisions",
  "Preferences",
  "Routines",
  "Glossary",
];

export function registerResources(
  server: McpServer,
  octokit: Octokit,
  owner: string,
  repo: string,
  orgFilePath: string,
) {
  server.resource(
    "organisation.md - Full Content",
    "organisation.md://full",
    {
      description: "The entire organisation.md file with all sections",
      mimeType: "text/markdown",
    },
    async () => {
      try {
        const file = await readFile(octokit, owner, repo, orgFilePath);
        return {
          contents: [{
            uri: "organisation.md://full",
            text: file.content,
            mimeType: "text/markdown",
          }],
        };
      } catch (error) {
        return {
          contents: [{
            uri: "organisation.md://full",
            text: `Error loading organisation.md: ${error instanceof Error ? error.message : String(error)}`,
            mimeType: "text/plain",
          }],
        };
      }
    },
  );

  // Register each section as a template resource
  for (const sectionName of SECTION_NAMES) {
    const slug = sectionName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    const uri = `organisation.md://sections/${slug}`;

    server.resource(
      `organisation.md - ${sectionName}`,
      uri,
      {
        description: `The ${sectionName} section of organisation.md`,
        mimeType: "text/markdown",
      },
      async () => {
        try {
          const file = await readFile(octokit, owner, repo, orgFilePath);
          const doc = parseDocument(file.content);
          const section = getSection(doc, sectionName);

          if (!section) {
            return {
              contents: [{
                uri,
                text: `# ${sectionName}\n\n*This section has not been created yet.*`,
                mimeType: "text/markdown",
              }],
            };
          }

          return {
            contents: [{
              uri,
              text: section.content,
              mimeType: "text/markdown",
            }],
          };
        } catch (error) {
          return {
            contents: [{
              uri,
              text: `Error loading section: ${error instanceof Error ? error.message : String(error)}`,
              mimeType: "text/plain",
            }],
          };
        }
      },
    );
  }
}
