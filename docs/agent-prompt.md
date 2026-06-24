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
- `import_file` — import a txt, md, or docx file into the knowledge base
- `add_info` — add information via natural language (auto-detects section)
- `remove_info` — remove information matching a description
- `check_roles` — check git-based roles and codeowners
- `check_permissions` — check add/delete/approve/merge permissions
- `configure_codeowners` — set up path-level access control
- `report_bug` — auto-detect area and file a github issue
- `suggest_feature` — suggest a feature as a github issue

when you need to record new information (a decision, project update, team change),
use `update_section` or `propose_change` — these create pull requests for review.
```
