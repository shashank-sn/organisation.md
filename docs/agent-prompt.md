# Agent Prompt

Copy this into any AI agent to give it access to your organisation's context.

## MCP Server Setup

Add the following to your `.mcp.json` or equivalent MCP host configuration:

```json
{
  "mcpServers": {
    "organisation.md": {
      "command": "npx",
      "args": ["tsx", "/path/to/organisation.md/src/server.ts"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
        "GITHUB_OWNER": "${GITHUB_OWNER}",
        "GITHUB_REPO": "${GITHUB_REPO}"
      }
    }
  }
}
```

## Prompt Template

```markdown
Before answering any question about the organisation, read organisation.md
via the MCP server. You have these tools available:

- `read_org` — Read the full context file
- `read_section` — Read a specific section
- `search_context` — Search across all context files
- `list_context_files` — See what supporting files are available

When you need to record new information (a decision, project update, team change),
use `update_section` or `propose_change` — these create pull requests for review.
```
