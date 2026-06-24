# strategy

## target problem

every team using ai tools re-explains context across chats, agents, and team members. teams working with ai agents at scale need a single source of truth that every agent can read. existing solutions (saas products, wikis, manual files) are either hosted (data leaves your control), unstructured, or lack a standard ai protocol.

## our approach

we make the organisation's context a **git repo** with an **mcp server** on top. the repo is the backend — it stores everything. git provides version history, branching, pr review, and access control. the mcp server gives every ai agent a standard protocol to read, search, and update it.

three principles:
1. **open source, forkable** — one click, and your team has its own org memory.
2. **git-native** — no database. the repo is the database. all changes go through prs.
3. **mcp protocol** — any mcp-compatible ai tool connects directly.

## who it's for

engineering teams, startups, and open-source projects that use ai coding tools and need persistent organisational context.

## key metrics

- forks of the template repo
- github stars
- npm downloads of the mcp server

## tracks

| track | what | priority |
|-------|------|----------|
| **server** | mcp server with read/write/search/pr tools | p0 |
| **template** | the organisation.md file with all sections | p0 |
| **docs** | readme, quickstart, agent prompts | p0 |
| **dx** | easy setup, clear error messages | p1 |
| **extensions** | archive pruning, multi-file updates | p2 |

## milestones

1. v1.0 — forkable repo with mcp server, template, docs, github pages
2. community adoption — real teams using it, contributing improvements
3. extension system — pluggable context sources and exports
