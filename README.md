# organisation.md

**Your team's living memory — an MCP server backed by a git repo.**

[![MIT License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![CI](https://github.com/shashank-sn/organisation.md/actions/workflows/ci.yml/badge.svg)](https://github.com/shashank-sn/organisation.md/actions/workflows/ci.yml)

`organisation.md` turns any GitHub repository into your organisation's persistent context layer. Any MCP-compatible AI tool (Claude Code, Cursor, etc.) can **read**, **search**, and **propose updates** to your team's shared context — without a database, without a hosted service, without leaving your GitHub account.

---

## How it works

1. **Fork** this repository into your GitHub organisation.
2. **Edit** `organisation.md` with your team's identity, projects, decisions, and preferences.
3. **Run** the MCP server — your AI agents connect and read/write context naturally.

All changes go through **pull requests** — your team reviews and merges them. Git provides version history, branching, and access control out of the box.

## Quickstart

### 1. Generate a Personal Access Token

Go to [github.com/settings/tokens](https://github.com/settings/tokens) and generate a **classic token** with the `repo` scope. Copy the token — you'll need it in the next step.

### 2. Run with npx (recommended)

```bash
export GITHUB_TOKEN=ghp_your_token_here
export GITHUB_OWNER=your-github-username-or-org
export GITHUB_REPO=organisation.md
npx @shashank-sn/organisation-md
```

That's it. The MCP server starts in stdio mode and your AI agent can connect.

### 3. Or clone and run locally

```bash
git clone https://github.com/your-org/organisation.md.git
cd organisation.md
npm install
export GITHUB_TOKEN=ghp_your_token_here
export GITHUB_OWNER=your-github-username-or-org
export GITHUB_REPO=organisation.md
npx tsx src/server.ts
```

### 4. Connect to your AI agent

The server speaks MCP over stdio. Configure your AI tool to launch it:

**Claude Code** — add to your `.mcp.json`:

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

**Cursor / Continue / Other MCP hosts** — point to the same command with env vars.

## Tools

| Tool | Description |
|------|-------------|
| `read_org` | Read the full `organisation.md` file from the GitHub repo |
| `read_section` | Read a specific section by heading (e.g., "Team", "Decisions") |
| `update_section` | Propose an update to a section — creates a pull request |
| `search_context` | Search across `organisation.md` and all `CONTEXT/` files |
| `propose_change` | Propose a change to any file in the repo — creates a pull request |
| `list_context_files` | List all files in the `CONTEXT/` directory |

## Repository structure

```
organisation.md/
├── organisation.md          # Canonical org context file
├── CONTEXT/                 # Supporting context files
│   ├── README.md
│   ├── projects.md          # Detailed project info
│   ├── architecture.md      # System architecture
│   └── people.md            # Team members and roles
├── src/                     # MCP server source (TypeScript)
│   ├── server.ts            # Entry point
│   ├── github/              # Octokit wrapper (files, git API)
│   ├── content/             # Markdown parser and template
│   ├── tools/               # MCP tool implementations
│   └── resources/           # MCP resource templates
├── docs/                    # Documentation
│   ├── quickstart.md        # Full setup guide
│   ├── agent-prompt.md      # Prompt template for AI agents
│   └── example-flows.md     # Common workflows
├── scripts/
│   └── build-site.mjs       # GitHub Pages build script
├── .github/workflows/
│   ├── ci.yml               # CI: typecheck + test on push/PR
│   └── pages.yml            # GitHub Pages deployment
├── STRATEGY.md              # Product strategy
├── LICENSE                  # MIT
└── README.md
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub Personal Access Token with `repo` scope |
| `GITHUB_OWNER` | Yes | GitHub username or organisation that owns the repo |
| `GITHUB_REPO` | Yes | Repository name (defaults to `organisation.md`) |

## Customisation

1. **Edit `organisation.md`** — replace the template content with your team's actual identity, projects, and decisions.
2. **Add `CONTEXT/` files** — create additional markdown files for deeper context (architecture docs, runbooks, etc.).
3. **Fork and rename** — fork the repo into your org and update the env vars to point at your fork.

## Development

```bash
npm install
npm run dev         # Development server with hot reload
npm test            # Run tests
npm run typecheck   # TypeScript checking
npm run build       # Compile TypeScript
npm run build:site  # Build GitHub Pages site locally
```

## License

MIT — fork it, use it, ship it. See [LICENSE](./LICENSE).
