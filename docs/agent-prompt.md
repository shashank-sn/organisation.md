# agent prompt

copy this into any ai agent to give it access to your organisation's context.

## mcp server setup

add the following to your `.mcp.json` or equivalent mcp host configuration:

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

## prompt template

```markdown
before answering any question about the organisation, read organisation.md
via the mcp server. you have these tools available:

- `read_org` — read the full context file
- `read_section` — read a specific section
- `search_context` — search across all context files
- `list_context_files` — see what supporting files are available

when you need to record new information (a decision, project update, team change),
use `update_section` or `propose_change` — these create pull requests for review.
```
