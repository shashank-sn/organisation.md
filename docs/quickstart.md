# quickstart

## prerequisites

- node.js 20+
- a github account
- a personal access token with `repo` scope

## 1. generate a github personal access token

1. go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. click **generate new token (classic)** → **generate new token**
3. give it a name (e.g., "organisation-md")
4. select the `repo` scope (full control of private repositories)
5. click **generate token**
6. copy the token — you won't see it again

## 2. fork the repository

1. go to [github.com/shashank-sn/organisation.md](https://github.com/shashank-sn/organisation.md)
2. click **fork** → **create fork**
3. choose your personal account or an organisation

## 3. run with npx (no clone needed)

```bash
export GITHUB_TOKEN=ghp_your_token_here
export GITHUB_OWNER=your-github-username-or-org
export GITHUB_REPO=organisation.md
npx @shashank-sn/organisation-md
```

the mcp server starts in stdio mode. connect your ai agent to it.

## 4. or clone and set up

```bash
git clone https://github.com/YOUR_ORG/organisation.md.git
cd organisation.md
npm install
```

## 5. run the mcp server

```bash
export GITHUB_TOKEN=ghp_your_token_here
export GITHUB_OWNER=your-github-username-or-org
export GITHUB_REPO=organisation.md
npx tsx src/server.ts
```

## 6. connect to your mcp host

### claude code

add to your `.mcp.json` or project config:

```json
{
  "mcpServers": {
    "organisation.md": {
      "command": "npx",
      "args": ["@shashank-sn/organisation-md"],
      "env": {
        "GITHUB_TOKEN": "ghp_...",
        "GITHUB_OWNER": "your-org",
        "GITHUB_REPO": "organisation.md"
      }
    }
  }
}
```

### other mcp hosts

point your mcp host to `npx @shashank-sn/organisation-md` with the same env variables.

## all tools

| tool | description |
|------|-------------|
| `read_org` | read the full organisation.md file |
| `read_section` | read a specific section by heading |
| `update_section` | propose an update to a section (creates pr) |
| `search_context` | search across organisation.md and context/ files |
| `propose_change` | propose a change to any file (creates pr) |
| `list_context_files` | list all files in context/ directory |
| `import_file` | import a txt, md, or docx file into the knowledge base |
| `add_info` | add information via natural language — figures out section and file |
| `remove_info` | remove information matching a description |
| `check_roles` | check git-based roles and codeowners |
| `check_permissions` | check if you can add/delete/approve/merge |
| `configure_codeowners` | update .github/codeowners for team access control |
| `report_bug` | auto-detect the area and file a github issue |
| `suggest_feature` | suggest a feature or improvement as a github issue |

## importing files

the `import_file` tool lets you add files to the knowledge base.
the ai agent reads the file content and passes it to the tool, which:

1. creates a file in `context/`
2. updates `organisation.md` with a link to the imported file
3. opens a pull request for review

supported formats: `.txt`, `.md`, `.docx` (text extracted automatically).

## using natural language

the `add_info` tool accepts plain english descriptions of what to add.
it auto-detects the best section to put the information in.

```text
"our new project is called veridian, led by alice"
→ detects "active projects" section → adds entry → creates pr

"we decided to use postgres for storage"
→ detects "decisions" section → adds entry → creates pr
```

the `remove_info` tool accepts descriptions of what to remove:

```text
"remove the project veridian entry"
→ finds matching lines → creates pr with the change
```

## setting up team roles

1. fork the repo into your organisation
2. edit `.github/codeowners` with your team's github handles
3. set up branch protection in your repo settings
4. use the `check_roles` tool to verify permissions

branch protection enforces that changes go through pull requests
with the right reviewers before merging. this works with any
github team — no additional setup needed.

### codeowners example

```
# team members who can approve changes
organisation.md @your-org/leadership @alice
context/ @your-org/team
```
