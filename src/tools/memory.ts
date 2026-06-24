import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Octokit } from "octokit";
import { z } from "zod";
import { addDecision } from "../memory/decisions.js";
import { addSession } from "../memory/sessions.js";
import { addEvent } from "../memory/events.js";
import { searchMemory } from "../memory/search.js";
import { getRelated, getMemoryGraph, getEntry } from "../memory/graph.js";
import { updateEntryStatus } from "../memory/status.js";
import { isGitHubHosted } from "../github/remote.js";

export function registerMemoryTools(
  server: McpServer,
  octokit: Octokit,
  owner: string,
  repo: string,
) {
  // add_decision
  server.tool(
    "add_decision",
    "Record a decision made during this session. Creates a decision file with status: proposed and opens a PR for review.",
    {
      context: z.string().describe("What prompted this decision — the situation, problem, or background"),
      decision: z.string().describe("What was decided — the actual decision itself"),
      rationale: z.string().describe("Why this decision was made — reasoning and justification"),
      alternatives: z.string().describe("What alternatives were considered and why they were rejected"),
      decided_by: z.string().describe("Who made the decision (name, role, or team)"),
      related: z.array(z.string()).optional().describe("Paths to related entries (e.g., 'CONTEXT/decisions/2026-06-24-slug.md')"),
      slug: z.string().optional().describe("Optional custom slug for the filename (auto-generated from decision title by default)"),
    },
    {},
    async ({ context, decision, rationale, alternatives, decided_by, related, slug }) => {
      try {
        const result = await addDecision(octokit, owner, repo, {
          context,
          decision,
          rationale,
          alternatives,
          decided_by,
          related,
          slug,
        });

        const parts = [
          `Decision recorded at \`${result.path}\`.`,
          `Status: **${result.status}**`,
        ];

        if (result.prUrl) {
          parts.push(`Pull request: ${result.prUrl}`);
          parts.push("The decision is pending review. A human needs to merge the PR to accept it.");
        }

        return {
          content: [{ type: "text", text: parts.join("\n") }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error recording decision: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // add_session
  server.tool(
    "add_session",
    "Record a session summary. Creates a session file with direct commit (no PR). Call this at conversation end or natural pauses.",
    {
      summary: z.string().describe("Summary of what was accomplished in this session"),
      decisions: z.array(z.string()).optional().describe("Paths to decision files created during this session"),
      open_questions: z.string().optional().describe("Open questions or follow-up items from this session"),
      related: z.array(z.string()).optional().describe("Paths to related entries"),
      slug: z.string().optional().describe("Optional custom slug for the filename"),
    },
    {},
    async ({ summary, decisions, open_questions, related, slug }) => {
      try {
        const result = await addSession(octokit, owner, repo, {
          summary,
          decisions,
          open_questions,
          related,
          slug,
        });

        return {
          content: [{ type: "text", text: `Session recorded at \`${result.path}\`.` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error recording session: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // add_event
  server.tool(
    "add_event",
    "Record a significant event or occurrence. Appends to the event log with direct commit (no PR).",
    {
      type: z.string().describe("Event type tag (e.g., 'milestone', 'incident', 'release', 'meeting')"),
      description: z.string().describe("Brief description of what happened"),
      related: z.array(z.string()).optional().describe("Paths to related decisions or sessions"),
    },
    {},
    async ({ type, description, related }) => {
      try {
        const result = await addEvent(octokit, owner, repo, { type, description, related });

        return {
          content: [{ type: "text", text: `Event appended to \`${result.path}\`.` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error recording event: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // get_related
  server.tool(
    "get_related",
    "Find all entries related to a given file via 'related:' frontmatter fields (both inbound and outbound).",
    {
      path: z.string().describe("Path to the entry (e.g., 'CONTEXT/decisions/2026-06-24-slug.md')"),
    },
    { readOnlyHint: true },
    async ({ path }) => {
      try {
        const results = await getRelated(octokit, owner, repo, path);

        if (results.length === 0) {
          return {
            content: [{ type: "text", text: `No related entries found for \`${path}\`.` }],
          };
        }

        const outbound = results.filter((r) => r.direction === "outbound");
        const inbound = results.filter((r) => r.direction === "inbound");

        const parts: string[] = [];

        if (outbound.length > 0) {
          parts.push("**Outbound links:**");
          outbound.forEach((r) => parts.push(`- \`${r.path}\` (${r.type})`));
        }

        if (inbound.length > 0) {
          parts.push("**Inbound links (referenced by):**");
          inbound.forEach((r) => parts.push(`- \`${r.path}\` (${r.type})`));
        }

        return {
          content: [{ type: "text", text: parts.join("\n") }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error finding related entries: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // get_memory_graph
  server.tool(
    "get_memory_graph",
    "Return the full entry-relationship map: all entries grouped by type (decision, session, event) with their connections.",
    {},
    { readOnlyHint: true },
    async () => {
      try {
        const graph = await getMemoryGraph(octokit, owner, repo);

        const parts: string[] = ["# Memory Graph\n"];

        parts.push(`**Decisions:** ${graph.decisions.length}`);
        for (const d of graph.decisions) {
          parts.push(`- \`${d.path}\` — ${d.title}${d.status ? ` (${d.status})` : ""}${d.related.length > 0 ? ` → [${d.related.length} related]` : ""}`);
        }

        parts.push(`\n**Sessions:** ${graph.sessions.length}`);
        for (const s of graph.sessions) {
          parts.push(`- \`${s.path}\` — ${s.title}${s.related.length > 0 ? ` → [${s.related.length} related]` : ""}`);
        }

        parts.push(`\n**Events:** ${graph.events.length}`);
        for (const e of graph.events) {
          parts.push(`- \`${e.path}\` — ${e.title}${e.related.length > 0 ? ` → [${e.related.length} related]` : ""}`);
        }

        const totalEntries = graph.decisions.length + graph.sessions.length + graph.events.length;
        parts.push(`\n**Total entries:** ${totalEntries}`);

        return {
          content: [{ type: "text", text: parts.join("\n") }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error getting memory graph: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // get_entry
  server.tool(
    "get_entry",
    "Return the full content of any memory entry (decision, session, or event log).",
    {
      path: z.string().describe("Path to the entry (e.g., 'CONTEXT/decisions/2026-06-24-slug.md')"),
    },
    { readOnlyHint: true },
    async ({ path }) => {
      try {
        const content = await getEntry(octokit, owner, repo, path);

        if (content === null) {
          return {
            content: [{ type: "text", text: `Entry not found: \`${path}\`.` }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: `\`\`\`markdown\n${content}\n\`\`\`` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error reading entry: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // update_entry_status
  server.tool(
    "update_entry_status",
    "Update the status of a decision entry. Only status changes are allowed — the decision body is immutable after creation.",
    {
      path: z.string().describe("Path to the decision file (e.g., 'CONTEXT/decisions/2026-06-24-slug.md')"),
      status: z.enum(["accepted", "superseded"]).describe("New status: accepted (decision stands) or superseded (replaced by a later decision)"),
      reason: z.string().optional().describe("Optional reason for the status change"),
    },
    {},
    async ({ path, status, reason }) => {
      try {
        const result = await updateEntryStatus(octokit, owner, repo, {
          path,
          status,
          reason,
        });

        if (!result.success) {
          return {
            content: [{ type: "text", text: result.message }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: result.message }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error updating status: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );
}
