# organisation.md

**Your team's living memory — an MCP server backed by a git repo.**

`organisation.md` turns a GitHub repository into your organisation's persistent context layer. Any MCP-compatible AI tool (Claude Code, etc.) can read, search, and propose updates to your team's shared context — without a database, without a hosted service.

```
npm install -g @shashank-sn/organisation-md
export GITHUB_TOKEN=ghp_...
export GITHUB_OWNER=my-org
export GITHUB_REPO=organisation.md
organisation-md
```

## How it works

1. **Fork** this repository into your GitHub organisation.
2. **Edit** `organisation.md` with your team's identity, projects, decisions, and preferences.
3. **Run** the MCP server — your AI agents connect and read/write context naturally.

All changes go through **pull requests** — your team reviews and merges them.

## Tools

| Tool | What it does |
|------|-------------|
| `read_org` | Read the full `organisation.md` file |
| `read_section` | Read a specific section by heading |
| `update_section` | Propose an update to a section (creates PR) |
| `search_context` | Search across all context files |
| `propose_change` | Propose a change to any context file (creates PR) |
| `list_context_files` | List files in the `CONTEXT/` directory |

## Quickstart

```bash
# 1. Clone your fork
git clone https://github.com/your-org/organisation.md.git
cd organisation.md

# 2. Install dependencies
npm install

# 3. Set environment variables
export GITHUB_TOKEN=ghp_your_personal_access_token
export GITHUB_OWNER=your-org
export GITHUB_REPO=organisation.md

# 4. Run the MCP server (stdio)
npx tsx src/server.ts
```

Connect your MCP host to the server (see [quickstart docs](./docs/quickstart.md)).

## Repository structure

```
organisation.md/
├── organisation.md          # Canonical org context file
├── CONTEXT/                 # Supporting context files
│   ├── README.md
│   ├── projects.md
│   ├── architecture.md
│   └── people.md
├── src/                     # MCP server source
├── docs/                    # Documentation and plans
├── STRATEGY.md              # Product strategy
├── LICENSE                  # MIT
└── README.md
```

## License

MIT — fork it, use it, ship it.
