#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Octokit } from "octokit";
import { parseTransportMode, parsePort } from "./transport/types.js";
import { startSseServer } from "./transport/sse.js";
import { registerReadTools } from "./tools/read.js";
import { registerWriteTools } from "./tools/write.js";
import { registerProposeTools } from "./tools/propose.js";
import { registerSearchTools } from "./tools/search.js";
import { registerListTools } from "./tools/list.js";
import { registerImportTools } from "./tools/import.js";
import { registerManageTools } from "./tools/manage.js";
import { registerRoleTools } from "./tools/roles.js";
import { registerIssueTools } from "./tools/issues.js";
import { registerMemoryTools } from "./tools/memory.js";
import { ensureMemoryLayer } from "./memory/init.js";
import { getMemoryGraph } from "./memory/graph.js";
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

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const orgFilePath = "organisation.md";
const today = new Date().toISOString().split("T")[0];

// Initialize memory layer (creates directories implicitly on first write)
ensureMemoryLayer(octokit, GITHUB_OWNER, GITHUB_REPO).catch(() => {
  // Non-blocking: tools will self-initialize if this fails
});

// Build a dynamic system prompt with runtime state
const memoryInfo: string = await (async () => {
  try {
    const graph = await getMemoryGraph(octokit, GITHUB_OWNER, GITHUB_REPO);
    const parts: string[] = [];
    parts.push(`Connected to ${GITHUB_OWNER}/${GITHUB_REPO} as of ${today}.`);
    parts.push(`Memory layer: ${graph.decisions.length} decisions, ${graph.sessions.length} sessions, ${graph.events.length} events.`);
    return parts.join(" ");
  } catch {
    return `Connected to ${GITHUB_OWNER}/${GITHUB_REPO} as of ${today}.`;
  }
})();

const instructions = [
  memoryInfo,
  "",
  "=== Core Tools ===",
  "read_org — view the full organisation.md file.",
  "read_section — read a specific section by heading.",
  "search_context — find information across org file, context files, and all memory stores. Supports filtering by status, date, type.",
  "update_section / propose_change — propose updates via pull requests for review.",
  "import_file — bring .txt, .md, or .docx files into the knowledge base.",
  "add_info / remove_info — manage context via natural language.",
  "check_roles / check_permissions / configure_codeowners — team access control.",
  "report_bug / suggest_feature — create GitHub issues automatically.",
  "",
  "=== Memory Layer ===",
  "Three git-native knowledge stores:",
  "- Decision log (CONTEXT/decisions/): immutable decision records. Use add_decision when you reach a decision — creates a file via PR with status:proposed.",
  "- Session log (CONTEXT/sessions/): agent session records. Use add_session at conversation end.",
  "- Event log (CONTEXT/events/): individual event files. Use add_event for significant occurrences.",
  "",
  "Knowledge graph: get_related (inbound + outbound links), get_memory_graph (full map), get_entry (full content).",
  "Decision lifecycle: proposed → accepted | superseded. Use update_entry_status to change status. Only status is editable — decision bodies are immutable.",
].join("\n");

const server = new McpServer(
  { name: "organisation.md", version: "0.1.0" },
  { instructions },
);

registerReadTools(server, octokit, GITHUB_OWNER, GITHUB_REPO, orgFilePath);
registerWriteTools(server, octokit, GITHUB_OWNER, GITHUB_REPO, orgFilePath);
registerProposeTools(server, octokit, GITHUB_OWNER, GITHUB_REPO);
registerSearchTools(server, octokit, GITHUB_OWNER, GITHUB_REPO);
registerListTools(server, octokit, GITHUB_OWNER, GITHUB_REPO);
registerImportTools(server, octokit, GITHUB_OWNER, GITHUB_REPO, orgFilePath);
registerManageTools(server, octokit, GITHUB_OWNER, GITHUB_REPO, orgFilePath);
registerRoleTools(server, octokit, GITHUB_OWNER, GITHUB_REPO);
registerIssueTools(server, octokit, GITHUB_OWNER, GITHUB_REPO);
registerMemoryTools(server, octokit, GITHUB_OWNER, GITHUB_REPO);
registerResources(server, octokit, GITHUB_OWNER, GITHUB_REPO, orgFilePath);

const mode = parseTransportMode(process.env.TRANSPORT);

if (mode === "sse") {
  const port = parsePort(process.env.PORT);
  await startSseServer(server, { port });
} else {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
