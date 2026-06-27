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

<!-- Record feedback, insights, and learnings about your org here.
     Added entries can reference decision or session files for context. -->

## Glossary

| Term | Definition |
|------|------------|
| Term 1 | Definition 1 |
