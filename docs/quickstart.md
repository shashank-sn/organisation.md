# Quickstart

## Prerequisites

- Node.js 20+
- A GitHub account
- A Personal Access Token with `repo` scope

## 1. Generate a GitHub Personal Access Token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)** → **Generate new token**
3. Give it a name (e.g., "organisation-md")
4. Select the `repo` scope (full control of private repositories)
5. Click **Generate token**
6. Copy the token — you won't see it again

## 2. Fork the repository

1. Go to [github.com/shashank-sn/organisation.md](https://github.com/shashank-sn/organisation.md)
2. Click **Fork** → **Create fork**
3. Choose your personal account or an organisation

## 3. Run with npx (no clone needed)

```bash
export GITHUB_TOKEN=ghp_your_token_here
export GITHUB_OWNER=your-github-username-or-org
export GITHUB_REPO=organisation.md
npx @shashank-sn/organisation-md
```

The MCP server starts in stdio mode. Connect your AI agent to it.

## 4. Or clone and set up

```bash
git clone https://github.com/YOUR_ORG/organisation.md.git
cd organisation.md
npm install
```

## 5. Run the MCP server

```bash
export GITHUB_TOKEN=ghp_your_token_here
export GITHUB_OWNER=your-github-username-or-org
export GITHUB_REPO=organisation.md
npx tsx src/server.ts
```

## 6. Connect to your MCP host

### Claude Code

Add to your `.mcp.json` or project config:

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

### Other MCP hosts

Point your MCP host to `npx @shashank-sn/organisation-md` with the same env variables.
