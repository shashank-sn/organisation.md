#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Octokit } from "octokit";
import { registerReadTools } from "./tools/read.js";
import { registerWriteTools } from "./tools/write.js";
import { registerProposeTools } from "./tools/propose.js";
import { registerSearchTools } from "./tools/search.js";
import { registerListTools } from "./tools/list.js";
import { registerImportTools } from "./tools/import.js";
import { registerManageTools } from "./tools/manage.js";
import { registerRoleTools } from "./tools/roles.js";
import { registerIssueTools } from "./tools/issues.js";
import { registerResources } from "./resources/index.js";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
  console.error(
    "missing required environment variables:\n" +
    "  GITHUB_TOKEN  — github personal access token with repo scope\n" +
    "  GITHUB_OWNER  — github owner (user or organization)\n" +
    "  GITHUB_REPO   — github repository name\n"
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
      "this server provides your organization's context from a git repo. " +
      "use read_org to see the full context file, read_section for specific sections, " +
      "and search_context to find information. " +
      "use update_section and propose_change to propose updates — they create pull requests for review. " +
      "use import_file to bring txt, md, or docx files into the knowledge base. " +
      "use add_info and remove_info to manage context via natural language. " +
      "use check_roles, check_permissions, and configure_codeowners for team access control. " +
      "use report_bug and suggest_feature to create github issues automatically.",
  }
);

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const orgFilePath = "organisation.md";

registerReadTools(server, octokit, GITHUB_OWNER, GITHUB_REPO, orgFilePath);
registerWriteTools(server, octokit, GITHUB_OWNER, GITHUB_REPO, orgFilePath);
registerProposeTools(server, octokit, GITHUB_OWNER, GITHUB_REPO);
registerSearchTools(server, octokit, GITHUB_OWNER, GITHUB_REPO);
registerListTools(server, octokit, GITHUB_OWNER, GITHUB_REPO);
registerImportTools(server, octokit, GITHUB_OWNER, GITHUB_REPO, orgFilePath);
registerManageTools(server, octokit, GITHUB_OWNER, GITHUB_REPO, orgFilePath);
registerRoleTools(server, octokit, GITHUB_OWNER, GITHUB_REPO);
registerIssueTools(server, octokit, GITHUB_OWNER, GITHUB_REPO);
registerResources(server, octokit, GITHUB_OWNER, GITHUB_REPO, orgFilePath);

const transport = new StdioServerTransport();
await server.connect(transport);
