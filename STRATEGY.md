# Strategy

## Target Problem

Every team using AI tools re-explains context across chats, agents, and team members. Teams working with AI agents at scale need a single source of truth that every agent can read. Existing solutions (SaaS products, wikis, manual files) are either hosted (data leaves your control), unstructured, or lack a standard AI protocol.

## Our Approach

We make the organisation's context a **git repo** with an **MCP server** on top. The repo is the backend — it stores everything. Git provides version history, branching, PR review, and access control. The MCP server gives every AI agent a standard protocol to read, search, and update it.

Three principles:
1. **Open source, forkable** — One click, and your team has its own org memory.
2. **Git-native** — No database. The repo IS the database. All changes go through PRs.
3. **MCP protocol** — Any MCP-compatible AI tool connects directly.

## Who It's For

Engineering teams, startups, and open-source projects that use AI coding tools and need persistent organisational context.

## Key Metrics

- Forks of the template repo
- GitHub stars
- npm downloads of the MCP server

## Tracks

| Track | What | Priority |
|-------|------|----------|
| **Server** | MCP server with read/write/search/PR tools | P0 |
| **Template** | The organisation.md file with all sections | P0 |
| **Docs** | README, quickstart, agent prompts | P0 |
| **DX** | Easy setup, clear error messages | P1 |
| **Extensions** | Archive pruning, multi-file updates | P2 |

## Milestones

1. v1.0 — Forkable repo with MCP server, template, docs, GitHub Pages
2. Community adoption — Real teams using it, contributing improvements
3. Extension system — Pluggable context sources and exports
