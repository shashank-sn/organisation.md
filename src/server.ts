#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createGitHubClient } from "./github/client.js";
import { registerReadTools } from "./tools/read.js";
import { registerWriteTools } from "./tools/write.js";
import { registerProposeTools } from "./tools/propose.js";
import { registerSearchTools } from "./tools/search.js";
import { registerListTools } from "./tools/list.js";
import { registerResources } from "./resources/index.js";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
  console.error(
    "Missing required environment variables:\n" +
    "  GITHUB_TOKEN  — GitHub Personal Access Token with repo scope\n" +
    "  GITHUB_OWNER  — GitHub owner (user or organization)\n" +
    "  GITHUB_REPO   — GitHub repository name\n"
  );
  process.exit(1);
}

const server = new McpServer(
  {
    name: "organisation.md",
    version: "0.1.0",
  },
  {
    instructions:
      "This server provides your organization's context from a git repo. " +
      "Use read_org to see the full context file, read_section for specific sections, " +
      "and search_context to find information. Use update_section and propose_change " +
      "to propose updates — they create pull requests for review.",
  }
);

const github = createGitHubClient(GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO);
const orgFilePath = "organisation.md";

registerReadTools(server, github, orgFilePath);
registerWriteTools(server, github, orgFilePath);
registerProposeTools(server, github);
registerSearchTools(server, github);
registerListTools(server, github);
registerResources(server, github, orgFilePath);

const transport = new StdioServerTransport();
await server.connect(transport);
