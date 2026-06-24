---
last_updated: 2026-06-24
---

## Identity

**Org name:** Your Organisation Name
**Description:** A short description of what your organisation does.
**Core values:**
- Value 1
- Value 2
- Value 3

## Mission & Vision

**Mission:** What we do and why.

**Vision:** The future we're building toward.

## Team

| Name | Role | Contact |
|------|------|---------|
| Name 1 | Role 1 | @mention |

## Active Projects

### Project Name
- **Status:** Active / Planning / Winding down
- **Goal:** What this project aims to achieve
- **Lead:** @person
- **Key links:** Link to repo, docs, or board

## Decisions

Decisions are now stored as individual files in the decision log at `CONTEXT/decisions/`. Each file has YAML frontmatter (`date`, `status`, `type`, `decided_by`, `related`) plus a markdown body.

To record a decision, use the `add_decision` MCP tool — it creates a new file and opens a PR for review.

### Active decisions
<!-- Active decisions are generated from the memory graph. Run get_memory_graph to see all entries. -->

### Status lifecycle
- **proposed** → **accepted** (decision stands) or **superseded** (replaced)
- Decision bodies are immutable after creation. Only status can be updated via `update_entry_status`.

## Preferences

### Communication
- How we like agents to communicate

### Code
- Language, style, formatting preferences

### Tooling
- Preferred tools and workflows

## Routines

- **Standups:** When and how
- **Reviews:** Code review process
- **Release cadence:** How often we ship

## Feedback & Insights

### 2026-06-24 - ClickUp Brain 2.0 architecture research
- **What it is:** ClickUp Brain 2.0 is an AI "intelligence layer" over the entire ClickUp workspace — tasks, docs, chat, calendar, email, and connected apps. It uses a multi-model backend (Claude, GPT, Gemini) with automatic model routing based on task type.
- **Core architecture:**
  - **Context graph** (built on Qatalog's ActionQuery engine): Permission-aware, real-time knowledge graph that auto-indexes all workspace data with "zero index lag." Only surfaces what the user has permission to see.
  - **Self-organizing + self-updating:** Entities auto-cluster into a semantic graph; continuous re-index from live event streams.
  - **Context compression:** Distills context into token-efficient vectors before sending to LLMs — their cost optimization brings operational cost to ~$0.91/user.
  - **Persistent memory:** Retains user preferences, formatting rules, and org context across sessions. Can import memories from ChatGPT/Claude.
  - **Agentic layer:** "Super Agents" as AI coworkers with Skills (composable tool-calling capabilities). Can generate slides, dashboards, websites, and code from a prompt.
  - **MCP support:** Model Context Protocol for external tool access (Gmail, GitHub, Figma, Slack) — 100+ integrations.
  - **Anti-sycophancy:** System prompt designed to challenge bad decisions rather than reinforce them.
- **Can we implement something similar?** The core components are:
  1. A knowledge graph/index over our org data (could use vector embeddings + graph DB or lightweight hybrid retrieval)
  2. Permission-aware access controls on top
  3. Multi-model routing based on task type (already have access to Claude, GPT via APIs)
  4. Persistent memory layer (relatively straightforward with vector storage)
  5. Agent/tool calling for task execution (MCP or custom tool system)
  6. Context compression for cost optimization
  The biggest lift is the knowledge graph + real-time indexing pipeline. Everything else is composable from existing tools and APIs.
- **Related reference:** GitHub-as-disaster-recovery pattern for backups: https://lp.leonardselvaraja.in/blog/2023/how-to-use-github-as-a-disaster-recovery-backup-system-for-spatie-backups

## Glossary

| Term | Definition |
|------|------------|
| Term 1 | Definition 1 |
