---
date: 2026-06-24
topic: memory-layer
---

# Memory layer requirements

## Summary

Extend the existing `organisation.md` MCP server with a git-native memory layer — three append-only knowledge stores (decisions, sessions, events) plus semantic search and a knowledge graph — all backed by git primitives with no external dependencies.

## Problem Frame

The existing MCP server lets agents read and write org context. But every agent session starts cold — no memory of previous conversations, no automated capture of decisions made, no graph of how knowledge connects. Agents re-explain context and decisions get lost in chat history. Teams that use AI agents at scale need persistent memory that accumulates automatically, is searchable across all stored knowledge, and reveals relationships between entries — all while staying git-native so there is no hosted service, no vector DB, and no infrastructure to manage.

## Key Decisions

- **One file per decision and session** (over single-file append-only) — avoids merge conflicts on concurrent automated writes, produces clean git diffs, and allows individual git history per entry. Events stay as a single append-only file since they are higher-frequency and lighter weight.
- **YAML frontmatter for structured fields** — machine-parseable for automated extraction and search, human-readable for PR reviews, and compatible with static site generators. Body remains markdown for narrative rationale.
- **PR-based writes for decisions, direct commits for sessions and events** — decisions need review before becoming org memory (they shape the org's direction). Session and event logs are operational — they should be fast and frictionless. Non-GitHub remotes fall back to direct commit on all paths.
- **Semantic search = full-text + structured field search** — git grep across all memory files, filtered by frontmatter fields (date range, status, type). No embeddings, no vector search. The structure of the data (date, status, related entries) provides enough semantic power for this use case.
- **Knowledge graph = file-level relationship traversal** — `related:` fields in frontmatter create edges between entries. The graph is traversed at query time by resolving file paths. No graph DB, no indexing infrastructure.
- **Automated extraction = agent-prompt-driven** — the MCP server provides the `add_decision` tool with structured input. The agent's system prompt instructs it to call this tool automatically when a decision is reached. The server does not sniff conversations — the agent self-reports.

## Requirements

### Memory store

- R1. The server MUST maintain an append-only decision log at `CONTEXT/decisions/`, one markdown file per decision with filename format `YYYY-MM-DD-slug.md`.
- R2. Each decision file MUST use YAML frontmatter with fields: `date`, `status` (proposed/accepted/superseded), `decided_by`, `type` (decision), and `related` (array of paths to related entries).
- R3. Each decision file body MUST capture narrative fields: Context (what prompted it), Decision (what was decided), Rationale (why), and Alternatives considered (what else was discussed and why rejected).
- R4. The server MUST maintain an append-only session log at `CONTEXT/sessions/`, one markdown file per session with filename format `YYYY-MM-DD-slug.md`.
- R5. Each session file MUST use YAML frontmatter with fields: `date`, `type` (session), `decisions` (array of paths to decisions made), and `related` (array of paths to related entries).
- R6. The server MUST maintain an append-only event log at `CONTEXT/events.md`, with entries appended to the bottom of the file. Each event entry includes date, type, description, and optional link to related decision/session.
- R7. The server MUST handle the non-GitHub remotes case — when the remote is not GitHub, decision writes MUST fall back to direct commit (bypassing PR), and sessions/events MUST fall back to direct commit as well.

### Automated extraction

- R8. The server MUST provide an `add_decision` tool that accepts structured input (context, decision, rationale, alternatives, decided_by, related) and creates a decision file with `status: proposed`, commits it, and opens a PR.
- R9. The server MUST provide an `add_session` tool that accepts structured input (summary, decisions made, open questions) and creates a session file with direct commit (no PR).
- R10. The server MUST provide an `add_event` tool that accepts structured input (type, description, related) and appends an entry to `CONTEXT/events.md` with a direct commit.

### Semantic search

- R11. The existing `search_context` tool MUST be extended to search across `organisation.md`, `CONTEXT/` files, `CONTEXT/decisions/`, `CONTEXT/sessions/`, and `CONTEXT/events.md`.
- R12. The search tool MUST support filtering by frontmatter fields: `status`, `type`, `date_from`, `date_to`.
- R13. Search results MUST include the file path, matched section/entry title, and a snippet of surrounding content.

### Knowledge graph

- R14. The server MUST provide a `get_related` tool that accepts a file path and returns all entries linked via `related:` fields (both inbound and outbound).
- R15. The server MUST provide a `get_memory_graph` tool that returns the full entry-relationship map: all entries grouped by type (decision, session, event) with their connections.
- R16. The server MUST provide a `get_entry` tool that accepts a file path and returns the full content of any memory entry (decision, session, or event).

### Existing tool updates

- R17. The server instructions field MUST be updated to describe the memory layer and instruct agents to self-report decisions, sessions, and events using the appropriate tools.
- R18. The existing `update_section` tool MUST remain unchanged. The `## Decisions` section in `organisation.md` should reference the external decision log rather than duplicate entries.

### Integrity

- R19. Decision entries MUST default to `status: proposed`. Only human review (merging the PR or an explicit `accept_decision` tool) MUST set `status: accepted`.
- R20. Decision and session files MUST NOT be edited retroactively by agents. Only the status field MAY be updated via an `update_entry_status` tool.
- R21. `CONTEXT/events.md` MUST be append-only — no edits to existing entries, no deletions.

## Actors

- **A1. MCP server** — the `organisation.md` server that provides tools and resources. Owns all git interactions.
- **A2. AI agent** — any MCP-compatible agent (Claude Code, Cursor, etc.) that reads/writes org context. Self-reports decisions, sessions, and events by calling the appropriate tools. Is the primary consumer of semantic search and knowledge graph queries.
- **A3. Human team member** — reviews decision PRs, reads session logs, browses events. Interacts via the git repo directly (PR review UI, GitHub web interface, local git clone).

## Key Flows

### Automated decision capture

- **F1. Decision capture**
  - **Trigger:** Agent reaches a decision during conversation.
  - **Actors:** A2, A1
  - **Steps:**
    1. Agent calls `add_decision` with structured input (context, decision, rationale, alternatives, decided_by, related).
    2. Server creates `CONTEXT/decisions/YYYY-MM-DD-slug.md` with YAML frontmatter (`status: proposed`) and markdown body.
    3. Server creates a branch, commits the file, and opens a PR.
    4. Server returns the PR URL and file path to the agent.
    5. Agent records the decision path in the session summary via `add_session`.
    6. Human reviews and merges the PR, setting `status: accepted` implicitly via merge.
  - **Covered by:** R1, R2, R3, R8, R19, R17

### Session memory

- **F2. Session log**
  - **Trigger:** Agent conversation ends or reaches a natural pause.
  - **Actors:** A2, A1
  - **Steps:**
    1. Agent calls `add_session` with summary, decisions made, and open questions.
    2. Agent includes paths to any decision files created during the session.
    3. Server creates `CONTEXT/sessions/YYYY-MM-DD-slug.md` with YAML frontmatter.
    4. Server commits directly to the default branch (no PR).
    5. Next agent session starts by reading recent session files to restore context.
  - **Covered by:** R4, R5, R9, R17

### Semantic search

- **F3. Search across all memory**
  - **Trigger:** Agent needs to find existing knowledge.
  - **Actors:** A2, A1
  - **Steps:**
    1. Agent calls `search_context` with query and optional frontmatter filters.
    2. Server fetches `organisation.md`, all files in `CONTEXT/`, `CONTEXT/decisions/`, `CONTEXT/sessions/`, and reads `CONTEXT/events.md`.
    3. Server performs case-insensitive full-text matching across all content.
    4. If frontmatter filters are provided, server skips files that don't match.
    5. Server returns ranked results with file paths, entry titles, and snippets.
  - **Covered by:** R11, R12, R13

### Knowledge graph traversal

- **F4. Find related entries**
  - **Trigger:** Agent needs to understand how a decision relates to others.
  - **Actors:** A2, A1
  - **Steps:**
    1. Agent calls `get_related` with a file path (e.g., `CONTEXT/decisions/2026-06-24-foo.md`).
    2. Server reads the target file's frontmatter to get outbound `related:` links.
    3. Server searches all decision/session/event files for inbound `related:` links pointing to the target path.
    4. Server returns the combined list with file paths, titles, and types.
    5. Agent can recursively call `get_related` on any result.
  - **Covered by:** R14, R15, R16

## Scope Boundaries

### In scope
- Decision log (`CONTEXT/decisions/`) with full structured format
- Session log (`CONTEXT/sessions/`) with summary format
- Event log (`CONTEXT/events.md`) with append-only entries
- Automated extraction tools (`add_decision`, `add_session`, `add_event`)
- Extended semantic search across all memory stores
- Knowledge graph (relationship traversal via `related:` fields)
- Decision status lifecycle (proposed → accepted/superseded)
- All changes to the existing MCP server
- All memory entries stored in the same git repo (no separate memory repo)

### Deferred for later
- Visual dashboard or UI for browsing the memory layer
- Multi-repo memory (memory spread across org repos)
- Notification hooks when decisions change status
- Auto-superseding — marking prior decisions as superseded when a new decision contradicts them
- Decision extraction from commit messages or PR descriptions
- Federation — multiple organisation.md repos sharing memory across teams

### Outside this product's identity
- Vector DB or embedding-based search — git grep + structured fields is sufficient
- Graph DB (Neo4j, etc.) — relationship traversal via file references is the git-native pattern
- Hosted memory service — the repo IS the memory, there is no hosted component
- Real-time sync or webhook-based indexing — the repo is queried on demand

## Dependencies / Assumptions

- The existing MCP server (TypeScript, Octokit, markdown parser) is the foundation — the memory layer adds functionality, it does not rewrite existing code.
- GitHub PAT with repo scope is the only auth mechanism (no OAuth).
- The existing PR-based write flow continues to work for decisions; session and event commits bypass PR.
- The `CONTEXT/` directory is already known to the MCP server via `list_context_files`. The new subdirectories (`decisions/`, `sessions/`) follow the same pattern.
- GitHub Contents API file size limit (1MB) is a theoretical constraint — individual decision/session files and `organisation.md` will stay well under this.
- The `organisation.md` Decisions section is a summary/reference; the full decision log lives in `CONTEXT/decisions/`.

## Sources / Research

- ClickUp Brain 2.0 architecture research (recorded in `organisation.md` Feedback & Insights section) — context graph, multi-model routing, persistent memory, anti-sycophancy principles informed the relationship traversal and decision status lifecycle design.
- GitMCP (gitmcp.io, idosal/git-mcp) — validates the "repo as MCP server" pattern. Our differentiation is write capability via PRs, structured memory stores, and knowledge graph traversal.
- GitHub MCP Server (github/github-mcp-server) — reference for API usage patterns with Octokit.
