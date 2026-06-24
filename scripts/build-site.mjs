#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import { marked } from "marked";

const SITE_DIR = "_site";

mkdirSync(`${SITE_DIR}/docs`, { recursive: true });
mkdirSync(`${SITE_DIR}/CONTEXT`, { recursive: true });

const CSS = `*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Noto Sans,Helvetica,Arial,sans-serif;color:#1f2328;background:#f6f8fa;line-height:1.6}
header{background:#24292f;color:#fff;padding:0 1.5rem;border-bottom:3px solid #2da44e}
header .inner{max-width:960px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:56px}
header h1{font-size:1.1rem;font-weight:600}
header h1 a{color:#fff;text-decoration:none}
header nav{display:flex;gap:1.25rem}
header nav a{color:#8b949e;text-decoration:none;font-size:.875rem;transition:color .15s}
header nav a:hover{color:#fff}
.hero{background:linear-gradient(135deg,#24292f 0%,#1b1f24 100%);color:#fff;padding:3.5rem 1.5rem;text-align:center}
.hero h2{font-size:2rem;font-weight:700;margin-bottom:.75rem}
.hero p{font-size:1.1rem;color:#8b949e;max-width:640px;margin:0 auto 1.5rem}
.hero-cta{display:inline-block;background:#2da44e;color:#fff;padding:.6rem 1.5rem;border-radius:6px;text-decoration:none;font-weight:500;font-size:.9rem;transition:background .15s}
.hero-cta:hover{background:#2c974b}
.code-block{background:#1b1f24;color:#e6edf3;padding:.75rem 1rem;border-radius:6px;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:.8125rem;overflow-x:auto;margin:.75rem 0;white-space:pre}
main{max-width:960px;margin:0 auto;padding:2rem 1.5rem 3rem}
section{margin-bottom:2.5rem}
section h2{font-size:1.35rem;font-weight:600;margin-bottom:1rem;padding-bottom:.375rem;border-bottom:2px solid #d0d7de}
section h3{font-size:1.05rem;font-weight:600;margin:1rem 0 .5rem}
section p,section li{font-size:.925rem;color:#656d76;margin-bottom:.5rem}
section ul{padding-left:1.25rem}
section ul li{list-style:disc}
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem}
.card{background:#fff;border:1px solid #d0d7de;border-radius:8px;padding:1.25rem;transition:border-color .15s,box-shadow .15s}
.card:hover{border-color:#2da44e;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.card h3{font-size:.95rem;margin:0 0 .375rem}
.card p{font-size:.825rem;color:#656d76;margin:0}
.card code{font-size:.8rem;background:#f6f8fa;padding:.15rem .35rem;border-radius:4px;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace}
.tools-table{width:100%;border-collapse:collapse;font-size:.875rem}
.tools-table td,.tools-table th{border:1px solid #d0d7de;padding:.5rem .75rem;text-align:left}
.tools-table th{background:#f6f8fa;font-weight:600;font-size:.8rem;text-transform:uppercase;letter-spacing:.03em;color:#656d76}
.tools-table tr:hover td{background:#f6f8fa}
.tools-table code{font-size:.8125rem;background:#f6f8fa;padding:.15rem .3rem;border-radius:4px;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace}
.quickstart-steps{list-style:none!important;padding:0!important}
.quickstart-steps li{background:#fff;border:1px solid #d0d7de;border-radius:8px;padding:1rem 1.25rem;margin-bottom:.75rem;display:flex;align-items:flex-start;gap:.75rem}
.step-num{background:#2da44e;color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700;flex-shrink:0;margin-top:.1rem}
.step-content{flex:1}
.step-content strong{font-size:.9rem}
.step-content p{font-size:.825rem;color:#656d76;margin:.25rem 0 0}
.step-content .code-block{margin:.5rem 0 0;font-size:.775rem}
footer{text-align:center;padding:2rem 1.5rem;color:#656d76;font-size:.825rem;border-top:1px solid #d0d7de}
footer a{color:#2da44e;text-decoration:none}
.page-content h1{font-size:1.5rem;font-weight:700;margin-bottom:1rem}
.page-content h2{font-size:1.2rem;margin-top:1.5rem}
.page-content h3{font-size:1.05rem;margin-top:1rem}
.page-content p,.page-content li{color:#656d76;font-size:.925rem}
.page-content ul{padding-left:1.25rem}
.page-content table{width:100%;border-collapse:collapse;font-size:.875rem;margin:1rem 0}
.page-content td,.page-content th{border:1px solid #d0d7de;padding:.5rem .75rem;text-align:left}
.page-content th{background:#f6f8fa;font-weight:600}
.page-content code{font-size:.8125rem;background:#f6f8fa;padding:.15rem .3rem;border-radius:4px;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace}
.page-content pre code{background:0 0;padding:0}
.page-content pre{background:#1b1f24;color:#e6edf3;padding:.75rem 1rem;border-radius:6px;overflow-x:auto;margin:.75rem 0}
.links-grid{display:flex;gap:1rem;flex-wrap:wrap;margin-top:1.5rem}
.links-grid a{background:#fff;border:1px solid #d0d7de;border-radius:8px;padding:1rem 1.5rem;text-decoration:none;color:#1f2328;font-weight:500;font-size:.875rem;transition:border-color .15s;display:flex;align-items:center;gap:.5rem}
.links-grid a:hover{border-color:#2da44e}
.links-grid a span{font-size:1.1rem}
`;

function wrapPage(title, body, extraHead = "") {
  const navLinks = [
    { href: "./", label: "Home" },
    { href: "./organisation.html", label: "Organisation Context" },
    { href: "./strategy.html", label: "Strategy" },
    { href: "https://github.com/shashank-sn/organisation.md", label: "GitHub" },
  ];
  const nav = navLinks.map((l) => `<a href="${l.href}">${l.label}</a>`).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — organisation.md</title>
<style>${CSS}</style>
${extraHead}
</head>
<body>
<header>
<div class="inner">
<h1><a href="./">organisation.md</a></h1>
<nav>${nav}</nav>
</div>
</header>
${body}
<footer>
<p>MIT License — <a href="https://github.com/shashank-sn/organisation.md">Fork on GitHub</a> — Your team's living memory.</p>
</footer>
</body>
</html>`;
}

// === Build index.html (Landing Page) ===
function buildIndex() {
  const body = `
<div class="hero">
<h2>Your team's living memory</h2>
<p>An MCP server backed by a git repo. Fork it, run it, and give every AI agent access to your organisation's context — without a database or hosted service.</p>
<a class="hero-cta" href="https://github.com/shashank-sn/organisation.md#quickstart">Get Started →</a>
</div>
<main>

<section>
<h2>How it works</h2>
<ol style="padding-left:1.25rem;font-size:.925rem;color:#656d76">
<li style="margin-bottom:.5rem"><strong>Fork</strong> the repo into your GitHub organisation.</li>
<li style="margin-bottom:.5rem"><strong>Edit</strong> <code>organisation.md</code> with your team's identity, projects, decisions, and preferences.</li>
<li style="margin-bottom:.5rem"><strong>Run</strong> the MCP server — your AI agents connect and read/write context naturally.</li>
</ol>
<p style="margin-top:.75rem;color:#656d76">All changes go through <strong>pull requests</strong> — your team reviews and merges them.</p>
</section>

<section>
<h2>Tools</h2>
<table class="tools-table">
<tr><th>Tool</th><th>What it does</th></tr>
<tr><td><code>read_org</code></td><td>Read the full <code>organisation.md</code> file</td></tr>
<tr><td><code>read_section</code></td><td>Read a specific section by heading</td></tr>
<tr><td><code>update_section</code></td><td>Propose an update to a section (creates PR)</td></tr>
<tr><td><code>search_context</code></td><td>Search across all context files</td></tr>
<tr><td><code>propose_change</code></td><td>Propose a change to any context file (creates PR)</td></tr>
<tr><td><code>list_context_files</code></td><td>List files in the <code>CONTEXT/</code> directory</td></tr>
</table>
</section>

<section>
<h2>Quickstart</h2>
<ol class="quickstart-steps">
<li>
<div class="step-num">1</div>
<div class="step-content">
<strong>Fork the repository</strong>
<p>Go to <a href="https://github.com/shashank-sn/organisation.md">github.com/shashank-sn/organisation.md</a> and click Fork.</p>
</div>
</li>
<li>
<div class="step-num">2</div>
<div class="step-content">
<strong>Generate a Personal Access Token</strong>
<p>Go to <a href="https://github.com/settings/tokens">github.com/settings/tokens</a>, generate a classic token with <code>repo</code> scope.</p>
</div>
</li>
<li>
<div class="step-num">3</div>
<div class="step-content">
<strong>Run with npx</strong>
<p>No clone needed. Run the MCP server directly:</p>
<div class="code-block">export GITHUB_TOKEN=ghp_your_token_here
export GITHUB_OWNER=your-org-name
export GITHUB_REPO=organisation.md
npx @shashank-sn/organisation-md</div>
</div>
</li>
<li>
<div class="step-num">4</div>
<div class="step-content">
<strong>Or clone and run locally</strong>
<div class="code-block">git clone https://github.com/your-org/organisation.md.git
cd organisation.md
npm install
export GITHUB_TOKEN=ghp_your_token_here
export GITHUB_OWNER=your-org-name
export GITHUB_REPO=organisation.md
npx tsx src/server.ts</div>
</div>
</li>
<li>
<div class="step-num">5</div>
<div class="step-content">
<strong>Connect to your AI agent</strong>
<p>Add the MCP server to your <code>.mcp.json</code> or run in stdio mode. See <a href="./docs/quickstart.html">quickstart docs</a>.</p>
</div>
</li>
</ol>
</section>

<section>
<h2>Repository</h2>
<div class="card-grid">
<div class="card">
<h3><code>organisation.md</code></h3>
<p>Canonical org context file with Identity, Mission, Team, Projects, Decisions, Preferences, Routines, Glossary.</p>
</div>
<div class="card">
<h3><code>CONTEXT/</code></h3>
<p>Supporting docs — projects, architecture, people, and more.</p>
</div>
<div class="card">
<h3><code>src/</code></h3>
<p>TypeScript MCP server with Octokit, markdown parser, and 6 tools.</p>
</div>
<div class="card">
<h3><code>STRATEGY.md</code></h3>
<p>Product strategy, tracks, and milestones.</p>
</div>
</div>
<div class="links-grid">
<a href="./organisation.html"><span>📄</span> View Organisation Context</a>
<a href="./strategy.html"><span>🎯</span> View Strategy</a>
<a href="https://github.com/shashank-sn/organisation.md"><span>🐙</span> View on GitHub</a>
</div>
</section>

</main>`;
  return wrapPage("organisation.md", body);
}

// === Build content pages (organisation.md, STRATEGY.md) ===
function buildContentPage(src, title) {
  const md = readFileSync(src, "utf-8");
  const bodyHtml = marked.parse(md, { gfm: true });
  const body = `<main class="page-content">${bodyHtml}</main>`;
  return wrapPage(title, body);
}

// === Build docs pages (quickstart, agent-prompt, example-flows) ===
function buildDocsPages() {
  const docFiles = [
    { src: "docs/quickstart.md", title: "Quickstart" },
    { src: "docs/agent-prompt.md", title: "Agent Prompt" },
    { src: "docs/example-flows.md", title: "Example Flows" },
  ];
  for (const doc of docFiles) {
    try {
      const md = readFileSync(doc.src, "utf-8");
      const bodyHtml = marked.parse(md, { gfm: true });
      const body = `<main class="page-content">${bodyHtml}</main>`;
      const html = wrapPage(`${doc.title} — organisation.md`, body);
      writeFileSync(`${SITE_DIR}/docs/${doc.src.replace("docs/", "").replace(/\.md$/, ".html")}`, html);
    } catch {
      // Skip if file doesn't exist
    }
  }
}

// === Execute ===
writeFileSync(`${SITE_DIR}/index.html`, buildIndex());
writeFileSync(`${SITE_DIR}/README.html`, buildContentPage("README.md", "README — organisation.md"));
writeFileSync(`${SITE_DIR}/organisation.html`, buildContentPage("organisation.md", "Organisation Context — organisation.md"));
writeFileSync(`${SITE_DIR}/strategy.html`, buildContentPage("STRATEGY.md", "Strategy — organisation.md"));
buildDocsPages();
try { cpSync("CONTEXT", `${SITE_DIR}/CONTEXT`, { recursive: true }); } catch {}

console.log("Site built in _site/");
