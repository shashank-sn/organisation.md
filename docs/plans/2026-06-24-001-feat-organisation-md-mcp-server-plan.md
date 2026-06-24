---
title: feat: organisation.md MCP server
type: feat
date: 2026-06-24
---

# feat: organisation.md MCP server

## Summary

Build an open-source (MIT) MCP server named `organisation.md` that provides an organizational memory layer backed entirely by a git repo on GitHub. Agents connect via MCP to read, write, search, and propose changes to the org's context file. The repo also carries a strategy doc, templates, and examples — anyone forks it and gets their own org memory layer.

---

## Problem Frame

Every organization using AI tools faces the same tax: re-explaining context across chats, agents, and team members — who the org is, what it's building, how it operates, what decisions have been made. Teams that work with AI agents at scale need a single source of truth that every agent can read before answering.

Existing solutions are either:
- **SaaS products** (Creed, etc.) — hosted, per-seat pricing, data leaves your control
- **Manual markdown files** — fragile, no structure, no agent protocol
- **Wiki/Notion** — no MCP protocol, agents can't read/write them naturally

This product solves it by making the org context a git repo with an MCP server on top. The repo is the backend. Git provides version history, branching, PR review, and access control. The MCP server gives every AI agent a standard protocol to read and update it.

---

## Requirements

R1. The MCP server MUST let agents read the full `organisation.md` file and individual sections.
R2. The MCP server MUST let agents update sections of `organisation.md` with proper attribution (who changed what).
R3. The MCP server MUST support proposing changes as GitHub Pull Requests (branch → commit → PR).
R4. The MCP server MUST support searching context across the `organisation.md` file.
R5. The MCP server MUST authenticate via a GitHub Personal Access Token with repo scope.
R6. The MCP server MUST run as a local stdio server (distributable via `npx`).
R7. The `organisation.md` file MUST ship with a template covering: Identity, Mission & Vision, Team, Projects, Decisions, Preferences, Routines, Glossary.
R8. The repo MUST include STRATEGY.md with the product's target problem, approach, and tracks.
R9. Everything MUST be MIT licensed.
R10. GitHub Pages MUST render the README and organisation.md as a public site.

---

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| **Local stdio MCP server** (not remote HTTP) | No hosting needed. Each user runs it locally via `npx`. Talks directly to GitHub API. This is the "deploy to GitHub Pages" model — the repo IS the backend. |
| **TypeScript + @modelcontextprotocol/sdk** | Chosen by user for long-term scalability. Broadest MCP spec coverage, best type safety for tool schemas. |
| **Octokit for GitHub API** | Official GitHub SDK for TypeScript. Handles auth, pagination, all API endpoints. |
| **GitHub PAT (repo scope)** | Simplest auth model. User generates a token, sets it as an env var. No OAuth setup, no hosting of an auth server. |
| **One tool per action** | Small surface (~5 tools). Dedicated schema per tool is clearer than search+execute for this scale. |
| **Git flow: PR-based writes** | Writes go through the git flow: create branch → commit → open PR. The PR is the review mechanism. (Direct writes to the default branch are available as an opt-in via env var.) |
| **Raw markdown stored via GitHub Contents API** | No need to clone the repo locally. The Contents API reads/writes individual files. Branches and commits use the Git Data API. |

---

## High-Level Technical Design

### Architecture

```
┌─────────────────┐     MCP (stdio)     ┌────────────────────────────┐
│  Claude Code /  │ ◄──────────────────► │  organisation.md MCP      │
│  Any MCP host   │                     │  (npx @org/md-server)      │
└─────────────────┘                     │                            │
                                        │  Tools:                    │
                                        │  • read_org                │
                                        │  • read_section            │
                                        │  • update_section          │
                                        │  • propose_change          │
                                        │  • list_context_files      │
                                        │  • search_context          │
                                        │                            │
                                        │  Resources:                │
                                        │  • organisation.md://full  │
                                        │  • organisation.md://{sec} │
                                        └──────────┬─────────────────┘
                                                   │ GitHub API (Octokit)
                                                   ▼
                              ┌──────────────────────────────────────────┐
                              │  github.com/your-org/organisation.md    │
                              │                                          │
                              │  ├── organisation.md  (canonical)       │
                              │  ├── CONTEXT/         (supporting docs) │
                              │  ├── README.md                           │
                              │  ├── STRATEGY.md                        │
                              │  └── docs/plans/                        │
                              └──────────────────────────────────────────┘
```

### Agent → Git flow

```
read_org / read_section
  │
  └── GET /repos/{owner}/{repo}/contents/organisation.md
      → decodes from base64, returns markdown

update_section (proposes change)
  │
  ├── GET sha of current file
  ├── Parse markdown into sections
  ├── Replace target section content
  ├── Create/update branch from default branch
  ├── PUT /repos/{owner}/{repo}/contents/organisation.md
  │   (on the new branch, with sha for conflict detection)
  └── POST /repos/{owner}/{repo}/pulls
      → returns PR URL

propose_change (arbitrary file changes)
  │
  ├── Same branch/commit/PR flow
  ├── Can specify file path, content, commit message
  └── Supports multi-file changes in one PR
```

### Tool definitions

| Tool | Description | Key params |
|---|---|---|
| `read_org` | Read the full organisation.md file | None |
| `read_section` | Read a specific section by heading name | section: string |
| `update_section` | Propose an update to a section (creates PR) | section, content, message |
| `propose_change` | Propose a change to any context file (creates PR) | path, content, message |
| `list_context_files` | List all files in the CONTEXT/ directory | None |
| `search_context` | Search across all context files by keyword | query: string |

### MCP Resources

| Resource URI | Description |
|---|---|
| `organisation.md://full` | The entire organisation.md file |
| `organisation.md://sections/identity` | Identity section |
| `organisation.md://sections/mission` | Mission & Vision section |
| organisation.md://sections/team | Team section |
| ...etc per template section | Other sections |

---

## Scope Boundaries

### In scope
- The MCP server (TypeScript, local stdio, GitHub API backend)
- Template `organisation.md` file with all sections
- `CONTEXT/` directory for supporting docs
- Full PR-based change proposal flow (branch → commit → PR)
- GitHub Pages setup for README/site
- STRATEGY.md
- README, CONTRIBUTING.md, LICENSE, SECURITY.md
- Example workflows and agent prompts

### Deferred to follow-up
- Web UI / dashboard for editing organisation.md
- OAuth flow (PAT-only for v1)
- Multiple org support in one server instance
- Webhook-based real-time sync when context changes
- Migration tooling from other systems (Notion, Confluence, etc.)
- Rich-text or visual editor for the markdown file

---

## Implementation Units

### U1. Repository scaffold and base structure

**Goal:** Create the GitHub repo with directory structure, package.json, TypeScript config, and all foundation files.

**Files:**
- `package.json`
- `tsconfig.json`
- `.gitignore`
- `LICENSE` (MIT)
- `SECURITY.md`
- `CONTRIBUTING.md`

**Approach:** Standard TypeScript project scaffold. Package name scoped for npm publishing later (`@shashank-sn/organisation-md` or similar). Dependencies: `@modelcontextprotocol/sdk`, `octokit`, `zod`, `typescript`, `tsx` (for dev), `vitest` (for tests).

**Patterns to follow:** Standard MCP SDK scaffold from the SDK docs — `McpServer` with tools and resources.

---

### U2. GitHub API client module

**Goal:** Build the Octokit client wrapper that handles all GitHub API interactions.

**Files:**
- `src/github/client.ts`
- `src/github/types.ts`
- `src/github/files.ts`
- `src/github/git.ts`

**Approach:**
- `client.ts`: Octokit instance initialized from `GITHUB_TOKEN` and `GITHUB_OWNER`/`GITHUB_REPO` env vars
- `files.ts`: Read file from Contents API, decode base64, parse markdown. Write file via Contents API with SHA for conflict detection.
- `git.ts`: Create branch from a base ref, commit file changes, open PR. Uses Git Data API (create blob → create tree → create commit → update ref → create PR).

**Test scenarios:**
- Read a file returns decoded content with SHA
- Read non-existent file returns clear error
- Create branch from default branch succeeds
- Create PR returns the PR URL
- Write with stale SHA (conflict) returns meaningful error
- Multi-file change creates a tree with all files

**Verification:** Unit tests with mocked Octokit. Manual test against a test repo with a PAT.

---

### U3. Content model and markdown parser

**Goal:** Parse and manipulate `organisation.md` by sections with stable heading detection.

**Files:**
- `src/content/parser.ts`
- `src/content/types.ts`
- `src/content/template.ts`

**Approach:**
- Parse markdown by H2 headings (`## Section Name`)
- Each section is: `{heading: string, content: string, startLine: number, endLine: number}`
- Replace section content by finding the heading and replacing everything until the next heading or EOF
- Template exports the default section schema (Identity, Mission, Team, etc.)
- Preserve frontmatter (if any) during section replacement

**Test scenarios:**
- Parse a full organisation.md into correct sections
- Replace a section preserves all other sections
- Replace preserves frontmatter
- Parse handles empty sections, sections with nested content
- Parse file with no sections returns whole file as one section

---

### U4. Core MCP server with tools

**Goal:** The MCP server with all tools registered and working.

**Files:**
- `src/server.ts`
- `src/tools/read.ts`
- `src/tools/write.ts`
- `src/tools/propose.ts`
- `src/tools/search.ts`
- `src/tools/list.ts`

**Approach:**
- Server name: `organisation.md`, version from package.json
- `read_org`: Calls GitHub API to fetch `organisation.md`, returns decoded content
- `read_section`: Fetches and parses the file, returns one section by heading
- `update_section`: Reads current file, parses section, replaces content, calls propose flow
- `propose_change`: Takes file path, content, commit message. Creates branch → commits → opens PR
- `list_context_files`: Lists files in `CONTEXT/` directory from GitHub
- `search_context`: Searches across all context files (fetches all, does simple text search)
- Each tool has proper `annotations` (readOnlyHint for read tools)
- Server instructions field tells agents to prefer reading before writing

**Test scenarios:**
- `read_org` returns the full decoded markdown
- `read_section` returns a specific section by heading
- `read_section` with unknown heading returns clear error
- `update_section` creates a PR with correct branch name, commit, and PR title
- `propose_change` creates a PR for a new file
- `search_context` returns matching sections across files
- All read-only tools have `readOnlyHint: true`
- Error response when GITHUB_TOKEN is not set

---

### U5. MCP resources

**Goal:** Expose organisation.md content as MCP resources for automatic loading.

**Files:**
- `src/resources/index.ts`

**Approach:**
- Resource URI template: `organisation.md://{path}`
- `organisation.md://full` → entire file
- `organisation.md://sections/{section}` → individual section (derived from parsed content)
- Resources are read-only and fetch on demand
- Resource metadata includes MIME type (`text/markdown`)

**Test scenarios:**
- Resource list includes all expected URIs
- Resource `organisation.md://full` returns the file
- Resource `organisation.md://sections/identity` returns just that section
- Unknown resource path returns MCP error

---

### U6. Template `organisation.md` file

**Goal:** The canonical context template with all sections filled with examples.

**Files:**
- `organisation.md`

**Approach:** A well-structured markdown file with these sections:

```
## Identity
Org name, description, core values

## Mission & Vision
What we're building and why

## Team
Key people and roles

## Active Projects
Current initiatives with descriptions

## Decisions
Historical decisions with dates, context, and rationale

## Preferences
How we like agents to communicate, format code, etc.

## Routines
Standups, reviews, release cadence

## Glossary
Domain terms and acronyms
```

Each section has example content that a real org would replace. Frontmatter with `last_updated` date.

---

### U7. Supporting context files and CONTEXT/ directory

**Goal:** Example files in the CONTEXT/ directory for structured org data.

**Files:**
- `CONTEXT/README.md`
- `CONTEXT/projects.md` (template)
- `CONTEXT/architecture.md` (template)
- `CONTEXT/people.md` (template)

**Approach:** Supporting files that agents can refer to for deeper context. The `list_context_files` tool reveals these. Each is a template with example content.

---

### U8. STRATEGY.md

**Goal:** The product strategy document.

**Files:**
- `STRATEGY.md`

**Approach:** Use the ce-strategy template format:

- Target problem
- Our approach
- Who it's for
- Key metrics
- Tracks
- Milestones

This is the strategy for the `organisation.md` product itself — what it is, who it serves, how it wins.

---

### U9. README, documentation, and agent prompts

**Goal:** Documentation that makes the repo immediately useful for anyone who forks it.

**Files:**
- `README.md`
- `docs/quickstart.md`
- `docs/agent-prompt.md`
- `docs/example-flows.md`

**Approach:**
- README: What it is, how to run it, how to fork it
- Quickstart: Generate a PAT, set env vars, run the MCP server
- Agent prompt: The exact prompt to paste into any agent to connect it
- Example flows: Common workflows (onboarding a new hire, recording a decision, updating project status)

---

### U10. GitHub Pages configuration

**Goal:** Render README and organisation.md as a public GitHub Pages site.

**Files:**
- `.github/workflows/pages.yml`
- `docs/_config.yml` (optional Jekyll config)

**Approach:** 
- GitHub Actions workflow that builds and deploys to GitHub Pages
- Jekyll or simple markdown rendering
- The site shows README as homepage and links to organisation.md as the full context document
- docs/ folder for any additional pages

**Verification:** Pages workflow runs successfully and site is accessible at `https://shashank-sn.github.io/organisation.md/`

---

### U11. Tests and CI

**Goal:** Automated tests and CI pipeline.

**Files:**
- `vitest.config.ts`
- `src/**/*.test.ts`
- `.github/workflows/ci.yml`

**Approach:**
- Vitest for unit tests
- Mock Octokit for GitHub API tests
- Parse markdown and content tests
- CI workflow runs on push/PR: lint → typecheck → test

---

## Open Questions

- **npm publishing**: Should this be published to npm as `@shashank-sn/organisation-md` so users can run it via `npx`? Deferred to after v1 — for now, users clone and run locally.

---

## Risks & Dependencies

- **GitHub API rate limits**: Unauthenticated requests are limited to 60/hr. Authenticated (PAT) is 5000/hr. The PAT is mandatory.
- **Contents API file size limit**: GitHub's Contents API has a 1MB file limit for individual files. `organisation.md` should stay under this.
- **Branch name collisions**: The MCP server uses timestamped branch names to avoid collisions (`proposal/YYYYMMDDHHMMSS`).
