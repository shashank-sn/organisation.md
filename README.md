# organisation.md

**your team's living memory — an mcp server backed by a git repo.**

[![MIT License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![CI](https://github.com/shashank-sn/organisation.md/actions/workflows/ci.yml/badge.svg)](https://github.com/shashank-sn/organisation.md/actions/workflows/ci.yml)

`organisation.md` turns any github repository into your organisation's persistent context layer. any mcp-compatible ai tool (claude code, cursor, etc.) can **read**, **search**, and **propose updates** to your team's shared context — without a database, without a hosted service, without leaving your github account.

---

## how it works

1. **fork** this repository into your github organisation.
2. **edit** `organisation.md` with your team's identity, projects, decisions, and preferences.
3. **run** the mcp server — your ai agents connect and read/write context naturally.

all changes go through **pull requests** — your team reviews and merges them. git provides version history, branching, and access control out of the box.

## quickstart

### 1. generate a personal access token

go to [github.com/settings/tokens](https://github.com/settings/tokens) and generate a **classic token** with the `repo` scope. copy the token — you'll need it in the next step.

### 2. run with npx (recommended)

```bash
export GITHUB_TOKEN=ghp_your_token_here
export GITHUB_OWNER=your-github-username-or-org
export GITHUB_REPO=organisation.md
npx @shashank-sn/organisation-md
```

that's it. the mcp server starts in stdio mode and your ai agent can connect.

### 3. or clone and run locally

```bash
git clone https://github.com/your-org/organisation.md.git
cd organisation.md
npm install
export GITHUB_TOKEN=ghp_your_token_here
export GITHUB_OWNER=your-github-username-or-org
export GITHUB_REPO=organisation.md
npx tsx src/server.ts
```

### 4. connect to your ai agent

the server speaks mcp over stdio. configure your ai tool to launch it:

**claude code** — add to your `.mcp.json`:

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

**cursor / continue / other mcp hosts** — point to the same command with env vars.

## tools

| tool | description |
|------|-------------|
| `read_org` | read the full `organisation.md` file from the github repo |
| `read_section` | read a specific section by heading (e.g., "team", "decisions") |
| `update_section` | propose an update to a section — creates a pull request |
| `search_context` | search across `organisation.md` and all `context/` files |
| `propose_change` | propose a change to any file in the repo — creates a pull request |
| `list_context_files` | list all files in the `context/` directory |

## repository structure

```
organisation.md/
├── organisation.md          # canonical org context file
├── context/                 # supporting context files
│   ├── README.md
│   ├── projects.md          # detailed project info
│   ├── architecture.md      # system architecture
│   └── people.md            # team members and roles
├── src/                     # mcp server source (typescript)
│   ├── server.ts            # entry point
│   ├── github/              # octokit wrapper (files, git api)
│   ├── content/             # markdown parser and template
│   ├── tools/               # mcp tool implementations
│   └── resources/           # mcp resource templates
├── docs/                    # documentation
│   ├── quickstart.md        # full setup guide
│   ├── agent-prompt.md      # prompt template for ai agents
│   └── example-flows.md     # common workflows
├── scripts/
│   └── build-site.mjs       # github pages build script
├── .github/workflows/
│   ├── ci.yml               # ci: typecheck + test on push/pr
│   └── pages.yml            # github pages deployment
├── strategy.md              # product strategy
├── license                  # mit
└── README.md
```

## environment variables

| variable | required | description |
|----------|----------|-------------|
| `github_token` | yes | github personal access token with `repo` scope |
| `github_owner` | yes | github username or organisation that owns the repo |
| `github_repo` | yes | repository name (defaults to `organisation.md`) |

## customisation

1. **edit `organisation.md`** — replace the template content with your team's actual identity, projects, and decisions.
2. **add `context/` files** — create additional markdown files for deeper context (architecture docs, runbooks, etc.).
3. **fork and rename** — fork the repo into your org and update the env vars to point at your fork.

## development

```bash
npm install
npm run dev         # development server with hot reload
npm test            # run tests
npm run typecheck   # typescript checking
npm run build       # compile typescript
npm run build:site  # build github pages site locally
```

## license

mit — fork it, use it, ship it. see [license](./license).
