#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import { marked } from "marked";

const SITE_DIR = "_site";

mkdirSync(`${SITE_DIR}/docs`, { recursive: true });
mkdirSync(`${SITE_DIR}/CONTEXT`, { recursive: true });

// =========================================================================
// Design System
// =========================================================================

const T = {
  // Colors
  ink: "#0f172a",
  inkMuted: "#475569",
  inkDim: "#94a3b8",
  surface: "#f8fafc",
  surfaceRaised: "#ffffff",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  accent: "#d97706",
  accentLight: "#fef3c7",
  accentDark: "#92400e",
  heroBg: "#0f172a",
  heroFg: "#f8fafc",
  heroMuted: "#94a3b8",
  codeBg: "#1e293b",
  codeFg: "#e2e8f0",
  success: "#059669",
  successLight: "#d1fae5",
  // Spacing
  gap: "1.5rem",
  sectionGap: "4rem",
  maxW: "72rem",
  contentW: "48rem",
  // Type
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", Helvetica, Arial, sans-serif',
  mono: 'ui-monospace, "SF Mono", "Cascadia Code", "Fira Code", "JetBrains Mono", Menlo, Consolas, monospace',
};

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:16px;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{font-family:${T.sans};color:${T.ink};background:${T.surface};line-height:1.6}
a{color:${T.accent};text-decoration:none;transition:color .15s}
a:hover{color:${T.accentDark}}
img{max-width:100%;height:auto}

/* Header */
.header{position:sticky;top:0;z-index:50;background:rgba(15,23,42,.97);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,.06)}
.headerInner{max-width:${T.maxW};margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:3.5rem;padding:0 1.5rem}
.headerLogo{font-size:.9375rem;font-weight:600;color:#f1f5f9;letter-spacing:-.01em}
.headerLogo:hover{color:#fff}
.headerNav{display:flex;gap:1.75rem;align-items:center}
.headerNav a{font-size:.8125rem;color:${T.heroMuted};transition:color .15s}
.headerNav a:hover{color:#fff}
.headerNav .navBtn{background:${T.accent};color:#fff!important;padding:.375rem 1rem;border-radius:9999px;font-weight:500;font-size:.8125rem}
.headerNav .navBtn:hover{background:${T.accentDark}}

/* Hero */
.hero{background:${T.heroBg};color:${T.heroFg};padding:5rem 1.5rem 4rem;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-40%;right:-20%;width:50rem;height:50rem;background:radial-gradient(circle,rgba(217,119,6,.06) 0%,transparent 70%);pointer-events:none}
.heroInner{max-width:${T.maxW};margin:0 auto;position:relative}
.heroTag{display:inline-block;font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:${T.accent};margin-bottom:1.25rem;border:1px solid rgba(217,119,6,.3);padding:.25rem .75rem;border-radius:9999px}
.hero h1{font-size:clamp(2rem,4.5vw,3.25rem);font-weight:700;line-height:1.15;letter-spacing:-.02em;max-width:42rem;margin-bottom:1.25rem}
.hero p{font-size:1.125rem;color:${T.heroMuted};max-width:34rem;line-height:1.7;margin-bottom:2rem}
.heroActions{display:flex;gap:.75rem;flex-wrap:wrap}
.heroCta{background:${T.accent};color:#fff!important;padding:.625rem 1.5rem;border-radius:8px;font-weight:600;font-size:.9375rem;display:inline-flex;align-items:center;gap:.5rem;transition:background .15s,transform .15s}
.heroCta:hover{background:${T.accentDark};transform:translateY(-1px)}
.heroSecondary{background:rgba(255,255,255,.08);color:${T.heroFg}!important;padding:.625rem 1.5rem;border-radius:8px;font-weight:500;font-size:.9375rem;display:inline-flex;align-items:center;gap:.5rem;transition:background .15s}
.heroSecondary:hover{background:rgba(255,255,255,.14)}
.heroStats{display:flex;gap:2.5rem;margin-top:3rem;padding-top:2rem;border-top:1px solid rgba(255,255,255,.08)}
.heroStat{font-size:.8125rem;color:${T.heroMuted}}
.heroStat strong{display:block;font-size:1.25rem;color:${T.heroFg};font-weight:600;margin-bottom:.125rem}

/* Sections */
.section{padding:4rem 1.5rem}
.sectionInner{max-width:${T.maxW};margin:0 auto}
.sectionLabel{font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:${T.accent};margin-bottom:.75rem}
.sectionTitle{font-size:clamp(1.5rem,2.5vw,2rem);font-weight:700;letter-spacing:-.015em;line-height:1.2;margin-bottom:1rem}
.sectionSub{color:${T.inkMuted};font-size:1rem;max-width:34rem;line-height:1.7;margin-bottom:2.5rem}
.sectionAlt{background:${T.surfaceRaised};border-top:1px solid ${T.border};border-bottom:1px solid ${T.border}}

/* How it works steps */
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(18rem,1fr));gap:1.5rem}
.step{background:${T.surfaceRaised};border:1px solid ${T.border};border-radius:12px;padding:1.75rem;position:relative;transition:border-color .2s,box-shadow .2s}
.step:hover{border-color:${T.accent};box-shadow:0 4px 20px rgba(0,0,0,.06)}
.stepNum{width:2rem;height:2rem;border-radius:8px;background:${T.accentLight};color:${T.accentDark};display:flex;align-items:center;justify-content:center;font-size:.8125rem;font-weight:700;margin-bottom:1rem}
.step h3{font-size:1rem;font-weight:600;margin-bottom:.5rem}
.step p{font-size:.875rem;color:${T.inkMuted};line-height:1.6}

/* Tools grid */
.toolsGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(20rem,1fr));gap:1rem}
.toolCard{background:${T.surfaceRaised};border:1px solid ${T.border};border-radius:10px;padding:1.25rem;display:flex;align-items:flex-start;gap:1rem;transition:border-color .2s,box-shadow .2s}
.toolCard:hover{border-color:${T.accent};box-shadow:0 2px 12px rgba(0,0,0,.05)}
.toolIcon{width:2.25rem;height:2.25rem;border-radius:8px;background:${T.surface};border:1px solid ${T.border};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.1rem}
.toolInfo{flex:1;min-width:0}
.toolInfo code{font-family:${T.mono};font-size:.8125rem;font-weight:600;color:${T.ink}}
.toolInfo p{font-size:.8125rem;color:${T.inkMuted};margin-top:.25rem;line-height:1.5}

/* Quickstart */
.quickstartGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(22rem,1fr));gap:1.5rem}
.qsStep{background:${T.surfaceRaised};border:1px solid ${T.border};border-radius:12px;padding:1.5rem;display:flex;gap:1rem;align-items:flex-start}
.qsStep:hover{border-color:${T.borderStrong}}
.qsNum{width:2rem;height:2rem;border-radius:9999px;background:${T.accent};color:#fff;display:flex;align-items:center;justify-content:center;font-size:.8125rem;font-weight:700;flex-shrink:0;margin-top:.125rem}
.qsContent{flex:1;min-width:0}
.qsContent strong{font-size:.9375rem;display:block;margin-bottom:.25rem}
.qsContent p{font-size:.8125rem;color:${T.inkMuted};line-height:1.5;margin-bottom:.5rem}
.qsContent p:last-child{margin-bottom:0}
.qsContent a{color:${T.accent};text-decoration:underline;text-underline-offset:2px}
.qsCode{background:${T.codeBg};color:${T.codeFg};border-radius:8px;padding:.625rem .875rem;font-family:${T.mono};font-size:.75rem;line-height:1.5;overflow-x:auto;white-space:pre;margin-top:.5rem}

/* Repo grid */
.repoGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));gap:1rem}
.repoCard{background:${T.surfaceRaised};border:1px solid ${T.border};border-radius:10px;padding:1.25rem;transition:border-color .2s}
.repoCard:hover{border-color:${T.borderStrong}}
.repoCard h3{font-family:${T.mono};font-size:.875rem;font-weight:600;margin-bottom:.375rem}
.repoCard p{font-size:.8125rem;color:${T.inkMuted};line-height:1.5}

/* Links bar */
.linkBar{display:flex;gap:.75rem;flex-wrap:wrap;margin-top:2rem}
.linkBar a{background:${T.surfaceRaised};border:1px solid ${T.border};border-radius:10px;padding:.75rem 1.25rem;text-decoration:none;color:${T.ink};font-weight:500;font-size:.875rem;transition:border-color .2s,box-shadow .2s;display:flex;align-items:center;gap:.5rem}
.linkBar a:hover{border-color:${T.accent};box-shadow:0 2px 8px rgba(0,0,0,.05)}
.linkBar a span{font-size:1.1rem;line-height:1}

/* Footer */
.footer{border-top:1px solid ${T.border};padding:2.5rem 1.5rem;text-align:center}
.footerInner{max-width:${T.maxW};margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.75rem}
.footer p,.footer a{font-size:.8125rem;color:${T.inkDim}}
.footer a:hover{color:${T.ink}}
.footerLinks{display:flex;gap:1.5rem}

/* Content pages */
.pageHeader{background:${T.heroBg};color:${T.heroFg};padding:3rem 1.5rem}
.pageHeaderInner{max-width:${T.contentW};margin:0 auto}
.pageHeader h1{font-size:1.75rem;font-weight:700;letter-spacing:-.015em;margin-bottom:.5rem}
.pageHeader p{color:${T.heroMuted};font-size:.9375rem}

.pageContent{max-width:${T.contentW};margin:0 auto;padding:2.5rem 1.5rem 4rem}
.pageContent h1{font-size:1.5rem;font-weight:700;letter-spacing:-.015em;margin-bottom:1rem;padding-bottom:.5rem;border-bottom:1px solid ${T.border}}
.pageContent h2{font-size:1.25rem;font-weight:600;margin-top:2rem;margin-bottom:.75rem;letter-spacing:-.01em}
.pageContent h3{font-size:1.0625rem;font-weight:600;margin-top:1.5rem;margin-bottom:.5rem}
.pageContent p,.pageContent li{color:${T.inkMuted};font-size:.9375rem;line-height:1.7}
.pageContent p{margin-bottom:1rem}
.pageContent ul,.pageContent ol{padding-left:1.25rem;margin-bottom:1rem}
.pageContent li{margin-bottom:.25rem}
.pageContent strong{color:${T.ink}}
.pageContent a{color:${T.accent};text-decoration:underline;text-underline-offset:2px}
.pageContent a:hover{color:${T.accentDark}}
.pageContent code{font-family:${T.mono};font-size:.8125rem;background:${T.surface};padding:.125rem .375rem;border-radius:4px;border:1px solid ${T.border}}
.pageContent pre{margin:1rem 0 1.5rem;background:${T.codeBg};color:${T.codeFg};border-radius:10px;padding:1rem 1.25rem;overflow-x:auto}
.pageContent pre code{background:none;border:none;padding:0;font-size:.8125rem;line-height:1.6}
.pageContent table{width:100%;border-collapse:collapse;margin:1rem 0 1.5rem;font-size:.875rem}
.pageContent th,.pageContent td{border:1px solid ${T.border};padding:.5rem .75rem;text-align:left}
.pageContent th{background:${T.surface};font-weight:600;font-size:.8125rem;color:${T.inkMuted}}
.pageContent td{color:${T.inkMuted}}
.pageContent hr{border:none;border-top:1px solid ${T.border};margin:2rem 0}

/* Responsive */
@media(max-width:640px){
  .hero{padding:3rem 1rem 2.5rem}
  .hero h1{font-size:1.625rem}
  .heroStats{flex-direction:column;gap:1rem}
  .steps,.toolsGrid,.quickstartGrid,.repoGrid{grid-template-columns:1fr}
  .section{padding:2.5rem 1rem}
  .footerInner{flex-direction:column;text-align:center}
  .headerInner{padding:0 1rem}
  .headerNav{gap:1rem}
}
@media(max-width:480px){
  .headerNav a:not(.navBtn){display:none}
}
`;


function wrapPage(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — organisation.md</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📋</text></svg>">
<style>${CSS}</style>
</head>
<body>
<header class="header">
<div class="headerInner">
<a href="./" class="headerLogo">organisation.md</a>
<nav class="headerNav">
<a href="./">Home</a>
<a href="./organisation.html">Context</a>
<a href="./strategy.html">Strategy</a>
<a href="https://github.com/shashank-sn/organisation.md">GitHub</a>
<a href="./docs/quickstart.html" class="navBtn">Quickstart</a>
</nav>
</div>
</header>
${body}
<footer class="footer">
<div class="footerInner">
<p>MIT License &mdash; <a href="https://github.com/shashank-sn/organisation.md">Fork on GitHub</a></p>
<div class="footerLinks">
<a href="./">Home</a>
<a href="./organisation.html">Context</a>
<a href="./strategy.html">Strategy</a>
<a href="https://github.com/shashank-sn/organisation.md">GitHub</a>
</div>
</div>
</footer>
</body>
</html>`;
}


// =========================================================================
// Landing Page
// =========================================================================

function buildIndex() {
  const body = `
<section class="hero">
<div class="heroInner">
<div class="heroTag">MCP Server &mdash; v0.1.0</div>
<h1>Your team&rsquo;s living memory</h1>
<p>Every AI agent in your organisation shares one source of truth &mdash; a git repo. No database. No hosted service. Just your team&rsquo;s context in markdown.</p>
<div class="heroActions">
<a href="./docs/quickstart.html" class="heroCta">
Get Started
<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
</a>
<a href="https://github.com/shashank-sn/organisation.md" class="heroSecondary">
<span>&#x6F;&#x72;</span> View on GitHub
</a>
</div>
<div class="heroStats">
<div class="heroStat"><strong>6</strong> MCP Tools</div>
<div class="heroStat"><strong>PR-based</strong> Write flow</div>
<div class="heroStat"><strong>1</strong> env var needed</div>
</div>
</div>
</section>

<section class="section">
<div class="sectionInner">
<div class="sectionLabel">How it works</div>
<h2 class="sectionTitle">Context your AI agents can actually read</h2>
<p class="sectionSub">Fork the repo, fill in your team&rsquo;s context, and connect any MCP-compatible AI tool.</p>
<div class="steps">
<div class="step">
<div class="stepNum">1</div>
<h3>Fork the repo</h3>
<p>Copy <code>organisation.md</code> into your GitHub organisation. The template includes Identity, Team, Projects, Decisions, and Preferences sections.</p>
</div>
<div class="step">
<div class="stepNum">2</div>
<h3>Write your context</h3>
<p>Edit the markdown files with your org&rsquo;s actual data &mdash; who does what, which projects are active, past decisions, and team preferences.</p>
</div>
<div class="step">
<div class="stepNum">3</div>
<h3>Run the server</h3>
<p>Start the MCP server with <code>npx @shashank-sn/organisation-md</code>. Your AI agents connect over stdio and read/write context naturally.</p>
</div>
</div>
</div>
</section>

<section class="section sectionAlt">
<div class="sectionInner">
<div class="sectionLabel">Tools</div>
<h2 class="sectionTitle">Six MCP tools, one purpose</h2>
<p class="sectionSub">Read, search, and propose updates to your organisation&rsquo;s context &mdash; all through pull requests.</p>
<div class="toolsGrid">
<div class="toolCard">
<div class="toolIcon">&#x1F4C4;</div>
<div class="toolInfo">
<code>read_org</code>
<p>Read the full organisation.md file from the GitHub repo.</p>
</div>
</div>
<div class="toolCard">
<div class="toolIcon">&#x1F50D;</div>
<div class="toolInfo">
<code>read_section</code>
<p>Read a specific section by heading (e.g. <code>Team</code>, <code>Decisions</code>).</p>
</div>
</div>
<div class="toolCard">
<div class="toolIcon">&#x270F;&#xFE0F;</div>
<div class="toolInfo">
<code>update_section</code>
<p>Propose an update to any section &mdash; creates a pull request.</p>
</div>
</div>
<div class="toolCard">
<div class="toolIcon">&#x1F50E;</div>
<div class="toolInfo">
<code>search_context</code>
<p>Search across organisation.md and all CONTEXT files.</p>
</div>
</div>
<div class="toolCard">
<div class="toolIcon">&#x1F4DD;</div>
<div class="toolInfo">
<code>propose_change</code>
<p>Propose a change to any tracked file &mdash; creates a PR.</p>
</div>
</div>
<div class="toolCard">
<div class="toolIcon">&#x1F4C1;</div>
<div class="toolInfo">
<code>list_context_files</code>
<p>List all files in the CONTEXT directory.</p>
</div>
</div>
</div>
</div>
</section>

<section class="section">
<div class="sectionInner">
<div class="sectionLabel">Setup</div>
<h2 class="sectionTitle">From zero to running in 30 seconds</h2>
<p class="sectionSub">One environment variable. One npx command. No database setup, no deployment pipeline.</p>
<div class="quickstartGrid">
<div class="qsStep">
<div class="qsNum">1</div>
<div class="qsContent">
<strong>Generate a PAT</strong>
<p>Go to <a href="https://github.com/settings/tokens">GitHub Settings</a> and create a classic token with <code>repo</code> scope.</p>
</div>
</div>
<div class="qsStep">
<div class="qsNum">2</div>
<div class="qsContent">
<strong>Set your env vars</strong>
<div class="qsCode">export GITHUB_TOKEN=ghp_yours
export GITHUB_OWNER=your-org
export GITHUB_REPO=organisation.md</div>
</div>
</div>
<div class="qsStep">
<div class="qsNum">3</div>
<div class="qsContent">
<strong>Run with npx</strong>
<div class="qsCode">npx @shashank-sn/organisation-md</div>
<p>Or clone and run: <code>npm install && npx tsx src/server.ts</code></p>
</div>
</div>
<div class="qsStep">
<div class="qsNum">4</div>
<div class="qsContent">
<strong>Connect your MCP host</strong>
<p>Point Claude Code, Cursor, or any MCP host to the server. See the <a href="./docs/quickstart.html">full quickstart guide</a>.</p>
</div>
</div>
</div>
</div>
</section>

<section class="section sectionAlt">
<div class="sectionInner">
<div class="sectionLabel">Repository</div>
<h2 class="sectionTitle">Everything in one place</h2>
<p class="sectionSub">The repo structure is designed to grow with your team. Start with the template, add context files as you go.</p>
<div class="repoGrid">
<div class="repoCard">
<h3>organisation.md</h3>
<p>Canonical context file &mdash; Identity, Mission, Team, Projects, Decisions, and more.</p>
</div>
<div class="repoCard">
<h3>CONTEXT/</h3>
<p>Supporting docs for projects, architecture, people, and anything else that deserves its own file.</p>
</div>
<div class="repoCard">
<h3>src/</h3>
<p>TypeScript MCP server with Octokit integration, markdown parser, and tool implementations.</p>
</div>
<div class="repoCard">
<h3>docs/</h3>
<p>Quickstart guide, agent prompt template, example flows, and product strategy.</p>
</div>
</div>
<div class="linkBar">
<a href="./organisation.html"><span>&#x1F4C4;</span> View Organisation Context</a>
<a href="./strategy.html"><span>&#x1F3AF;</span> View Strategy</a>
<a href="https://github.com/shashank-sn/organisation.md"><span>&#x1F419;</span> View on GitHub</a>
</div>
</div>
</section>`;
  return wrapPage("organisation.md", body);
}


// =========================================================================
// Content Pages
// =========================================================================

function buildContentPage(src, title) {
  const md = readFileSync(src, "utf-8");
  const bodyHtml = marked.parse(md, { gfm: true });
  const body = `
<div class="pageHeader">
<div class="pageHeaderInner">
<h1>${title}</h1>
</div>
</div>
<div class="pageContent">${bodyHtml}</div>`;
  return wrapPage(title, body);
}

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
      const body = `
<div class="pageHeader">
<div class="pageHeaderInner">
<h1>${doc.title}</h1>
</div>
</div>
<div class="pageContent">${bodyHtml}</div>`;
      const html = wrapPage(`${doc.title} — organisation.md`, body);
      writeFileSync(`${SITE_DIR}/docs/${doc.src.replace("docs/", "").replace(/\.md$/, ".html")}`, html);
    } catch {
      // Skip if file doesn't exist
    }
  }
}


// =========================================================================
// Execute
// =========================================================================

writeFileSync(`${SITE_DIR}/index.html`, buildIndex());
writeFileSync(`${SITE_DIR}/README.html`, buildContentPage("README.md", "README"));
writeFileSync(`${SITE_DIR}/organisation.html`, buildContentPage("organisation.md", "Organisation Context"));
writeFileSync(`${SITE_DIR}/strategy.html`, buildContentPage("STRATEGY.md", "Strategy"));
buildDocsPages();
try { cpSync("CONTEXT", `${SITE_DIR}/CONTEXT`, { recursive: true }); } catch {}

console.log("Site built in _site/");
