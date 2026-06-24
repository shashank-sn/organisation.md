#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import { marked } from "marked";

const SITE_DIR = "_site";

mkdirSync(`${SITE_DIR}/docs`, { recursive: true });
mkdirSync(`${SITE_DIR}/CONTEXT`, { recursive: true });

// =========================================================================
// design system
// =========================================================================

const T = {
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
  gap: "1.5rem",
  sectionGap: "4rem",
  maxW: "72rem",
  contentW: "48rem",
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

/* header */
.header{position:sticky;top:0;z-index:50;background:rgba(15,23,42,.97);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,.06)}
.headerInner{max-width:${T.maxW};margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:3.5rem;padding:0 1.5rem}
.headerLogo{font-size:.9375rem;font-weight:600;color:#f1f5f9;letter-spacing:-.01em}
.headerLogo:hover{color:#fff}
.headerNav{display:flex;gap:1.75rem;align-items:center}
.headerNav a{font-size:.8125rem;color:${T.heroMuted};transition:color .15s}
.headerNav a:hover{color:#fff}
.headerNav .navBtn{background:${T.accent};color:#fff!important;padding:.375rem 1rem;border-radius:9999px;font-weight:500;font-size:.8125rem}
.headerNav .navBtn:hover{background:${T.accentDark}}

/* hero */
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

/* sections */
.section{padding:4rem 1.5rem}
.sectionInner{max-width:${T.maxW};margin:0 auto}
.sectionAlt{background:${T.surfaceRaised};border-top:1px solid ${T.border};border-bottom:1px solid ${T.border}}
.sectionDark{background:${T.heroBg};color:${T.heroFg}}
.sectionLabel{font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:${T.accent};margin-bottom:.75rem}
.sectionTitle{font-size:clamp(1.5rem,2.5vw,2rem);font-weight:700;letter-spacing:-.015em;line-height:1.2;margin-bottom:1rem}
.sectionSub{color:${T.inkMuted};font-size:1rem;max-width:34rem;line-height:1.7;margin-bottom:2.5rem}

/* tools grid - redesigned */
.toolsGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(20rem,1fr));gap:1rem}
.toolCard{background:${T.surfaceRaised};border:1px solid ${T.border};border-radius:10px;padding:1.25rem;display:flex;align-items:flex-start;gap:1rem;transition:border-color .2s,box-shadow .2s}
.toolCard:hover{border-color:${T.accent};box-shadow:0 2px 12px rgba(0,0,0,.05)}
.toolIcon{width:2.25rem;height:2.25rem;border-radius:8px;background:${T.surface};border:1px solid ${T.border};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.1rem}
.toolInfo{flex:1;min-width:0}
.toolInfo code{font-family:${T.mono};font-size:.8125rem;font-weight:600;color:${T.ink}}
.toolInfo p{font-size:.8125rem;color:${T.inkMuted};margin-top:.25rem;line-height:1.5}

/* setup section - redesigned with pipeline visual */
.setupFlow{display:flex;gap:0;margin-bottom:2.5rem;overflow-x:auto;padding-bottom:.5rem}
.setupStep{flex:1;min-width:14rem;position:relative;padding:1.5rem 1.25rem;background:${T.surfaceRaised};border:1px solid ${T.border};border-right:none}
.setupStep:first-child{border-radius:10px 0 0 10px}
.setupStep:last-child{border-right:1px solid ${T.border};border-radius:0 10px 10px 0}
.setupStep:hover{background:${T.accentLight};border-color:${T.accent}}
.setupStep:hover+.setupStep,.setupStep:hover~.setupStep{border-left-color:${T.accent}}
.setupStepNum{background:${T.accent};color:#fff;width:1.5rem;height:1.5rem;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-size:.6875rem;font-weight:700;margin-bottom:.75rem}
.setupStep h3{font-size:.875rem;font-weight:600;margin-bottom:.25rem}
.setupStep p{font-size:.75rem;color:${T.inkMuted};line-height:1.5}

/* decision flow — agent memory as reviewable diffs */
.flowGrid{display:flex;gap:1.5rem;align-items:stretch;flex-wrap:wrap}
.flowCard{flex:1;min-width:10rem;background:${T.surfaceRaised};border:1px solid ${T.border};border-radius:12px;padding:1.5rem 1.25rem;text-align:center;position:relative;transition:border-color .2s,box-shadow .2s}
.flowCard:hover{border-color:${T.accent};box-shadow:0 4px 16px rgba(0,0,0,.06)}
.flowCard .flowNum{background:${T.accent};color:#fff;width:1.75rem;height:1.75rem;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;margin:0 auto .75rem}
.flowCard h3{font-size:.85rem;font-weight:600;margin-bottom:.375rem}
.flowCard p{font-size:.75rem;color:${T.inkMuted};line-height:1.5}
.flowArrow{color:${T.accent};font-size:1.25rem;font-weight:700;align-self:center;flex-shrink:0;padding:0 .25rem}
@media(max-width:768px){.flowGrid{flex-direction:column;gap:1rem}.flowArrow{transform:rotate(90deg);padding:.5rem 0}}

/* quickstart terminal-style cards */
.qsGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(22rem,1fr));gap:1.25rem}
.qsCard{background:${T.codeBg};color:${T.codeFg};border-radius:12px;overflow:hidden;position:relative}
.qsCardHeader{display:flex;gap:.375rem;padding:.75rem 1rem;border-bottom:1px solid rgba(255,255,255,.06)}
.qsDot{width:.5rem;height:.5rem;border-radius:9999px}
.qsDot:nth-child(1){background:#ef4444}
.qsDot:nth-child(2){background:#eab308}
.qsDot:nth-child(3){background:#22c55e}
.qsCardBody{padding:1rem 1.25rem;font-family:${T.mono};font-size:.75rem;line-height:1.7;white-space:pre;overflow-x:auto}
.qsCardBody .hl{color:${T.accent}}
.qsCardBody .cm{color:#6b7280}
.qsCardBody .fn{color:#60a5fa}

/* natural language upload section - new */
.featureGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(22rem,1fr));gap:1.5rem}
.featureCard{background:${T.surfaceRaised};border:1px solid ${T.border};border-radius:12px;padding:1.75rem;position:relative;overflow:hidden}
.featureCard::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:${T.accent};opacity:0;transition:opacity .2s}
.featureCard:hover::before{opacity:1}
.featureCard .icon{font-size:1.5rem;margin-bottom:.75rem;display:block}
.featureCard h3{font-size:.9375rem;font-weight:600;margin-bottom:.375rem}
.featureCard p{font-size:.8125rem;color:${T.inkMuted};line-height:1.6}
.featureCard .tags{margin-top:.75rem;display:flex;gap:.375rem;flex-wrap:wrap}
.featureCard .tags span{font-size:.6875rem;background:${T.accentLight};color:${T.accentDark};padding:.125rem .5rem;border-radius:9999px;font-weight:500}

/* file tree */
.fileTree{background:${T.surfaceRaised};border:1px solid ${T.border};border-radius:12px;padding:1.25rem 1.5rem;font-family:${T.mono};font-size:.8125rem;line-height:2;overflow-x:auto}
.fileTree .dir{color:${T.ink};font-weight:600}
.fileTree .file{color:${T.inkMuted}}
.fileTree .hl{color:${T.accent}}
.fileTree .indent{padding-left:1.5rem}
.fileTree .indent2{padding-left:3rem}

/* quickstart alternative - text-based */
.codeBlock{background:${T.codeBg};color:${T.codeFg};border-radius:10px;padding:1rem 1.25rem;font-family:${T.mono};font-size:.8125rem;line-height:1.6;overflow-x:auto;margin:.75rem 0}
.codeBlock .cmt{color:#6b7280}

/* repo grid */
.repoGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));gap:1rem}
.repoCard{background:${T.surfaceRaised};border:1px solid ${T.border};border-radius:10px;padding:1.25rem;transition:border-color .2s}
.repoCard:hover{border-color:${T.borderStrong}}
.repoCard h3{font-family:${T.mono};font-size:.875rem;font-weight:600;margin-bottom:.375rem}
.repoCard p{font-size:.8125rem;color:${T.inkMuted};line-height:1.5}

/* link bar */
.linkBar{display:flex;gap:.75rem;flex-wrap:wrap;margin-top:2rem}
.linkBar a{background:${T.surfaceRaised};border:1px solid ${T.border};border-radius:10px;padding:.75rem 1.25rem;text-decoration:none;color:${T.ink};font-weight:500;font-size:.875rem;transition:border-color .2s,box-shadow .2s;display:flex;align-items:center;gap:.5rem}
.linkBar a:hover{border-color:${T.accent};box-shadow:0 2px 8px rgba(0,0,0,.05)}
.linkBar a span{font-size:1.1rem;line-height:1}

/* footer with built-by */
.footer{border-top:1px solid ${T.border};padding:2.5rem 1.5rem;text-align:center;background:${T.heroBg};color:${T.heroMuted}}
.footerInner{max-width:${T.maxW};margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.75rem}
.footer p,.footer a{font-size:.8125rem;color:${T.inkDim}}
.footer a:hover{color:#fff}
.footer .builtBy{display:flex;align-items:center;gap:.375rem}
.footer .builtBy a{color:${T.accent};font-weight:500}
.footer .builtBy a:hover{color:${T.accentLight}}

/* content pages */
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

/* responsive */
@media(max-width:640px){
  .hero{padding:3rem 1rem 2.5rem}
  .hero h1{font-size:1.625rem}
  .heroStats{flex-direction:column;gap:1rem}
  .toolsGrid,.qsGrid,.featureGrid,.repoGrid{grid-template-columns:1fr}
  .setupFlow{flex-direction:column;gap:.5rem}
  .setupStep{border:1px solid ${T.border}!important;border-radius:8px!important;min-width:auto}
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
<a href="./">home</a>
<a href="./organisation.html">context</a>
<a href="./strategy.html">strategy</a>
<a href="https://github.com/shashank-sn/organisation.md">github</a>
<a href="./docs/quickstart.html" class="navBtn">quickstart</a>
</nav>
</div>
</header>
${body}
<footer class="footer">
<div class="footerInner">
<p>mit license &mdash; <a href="https://github.com/shashank-sn/organisation.md">view on github</a></p>
<div class="builtBy">
<span>built by</span>
<a href="https://github.com/shashank-sn">shashank</a>
</div>
</div>
</footer>
</body>
</html>`;
}


// =========================================================================
// landing page
// =========================================================================

function buildIndex() {
  const body = `
<section class="hero">
<div class="heroInner">
<div class="heroTag">mcp server &mdash; v0.1.0</div>
<h1>your team&rsquo;s living memory.</h1>
<p>every ai agent in your organisation shares one source of truth &mdash; a git repo. no database. no hosted service. just your team&rsquo;s context in markdown.</p>
<div class="heroActions">
<a href="./docs/quickstart.html" class="heroCta">
get started
<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
</a>
<a href="https://github.com/shashank-sn/organisation.md" class="heroSecondary">
view on github
</a>
</div>
<div class="heroStats">
<div class="heroStat"><strong>14</strong> mcp tools</div>
<div class="heroStat"><strong>pr-based</strong> write flow</div>
<div class="heroStat"><strong>1</strong> env var needed</div>
</div>
</div>
</section>

<section class="section">
<div class="sectionInner">
<div class="sectionLabel">how it works</div>
<h2 class="sectionTitle">context your ai agents can actually read</h2>
<p class="sectionSub">fork the repo, fill in your team&rsquo;s context, and connect any mcp-compatible ai tool.</p>
<div class="setupFlow">
<div class="setupStep">
<div class="setupStepNum">1</div>
<h3>fork the repo</h3>
<p>copy <code>organisation.md</code> into your github org. the template includes identity, team, projects, decisions, and preferences sections.</p>
</div>
<div class="setupStep">
<div class="setupStepNum">2</div>
<h3>write your context</h3>
<p>edit the markdown files with your org&rsquo;s actual data &mdash; who does what, which projects are active, past decisions.</p>
</div>
<div class="setupStep">
<div class="setupStepNum">3</div>
<h3>run the server</h3>
<p>start with <code>npx @shashank-sn/organisation-md</code>. your ai agents connect over stdio and read/write context naturally.</p>
</div>
</div>
</div>
</section>

<section class="section">
<div class="sectionInner">
<div class="sectionLabel">the wedge</div>
<h2 class="sectionTitle">agent memory as reviewable diffs</h2>
<p class="sectionSub">every context change goes through a pull request. no silent writes into agent state.</p>
<div class="flowGrid">
<div class="flowCard">
<div class="flowNum">1</div>
<h3>add a decision</h3>
<p>an agent proposes a context update &mdash; becomes a pr.</p>
</div>
<div class="flowArrow">→</div>
<div class="flowCard">
<div class="flowNum">2</div>
<h3>codeowners review</h3>
<p>teammates discuss, approve, or request changes.</p>
</div>
<div class="flowArrow">→</div>
<div class="flowCard">
<div class="flowNum">3</div>
<h3>merge</h3>
<p>approved changes become permanent context.</p>
</div>
<div class="flowArrow">→</div>
<div class="flowCard">
<div class="flowNum">4</div>
<h3>next agent reads it</h3>
<p>every agent that starts sees the updated context.</p>
</div>
</div>
</div>
</section>

<section class="section sectionAlt">
<div class="sectionInner">
<div class="sectionLabel">tools</div>
<h2 class="sectionTitle">14 mcp tools, one purpose</h2>
<p class="sectionSub">read, search, and propose updates to your organisation&rsquo;s context &mdash; all through pull requests.</p>
<div class="toolsGrid">
<div class="toolCard">
<div class="toolIcon">&#x1F4C4;</div>
<div class="toolInfo">
<code>read_org</code>
<p>read the full organisation.md file from the github repo.</p>
</div>
</div>
<div class="toolCard">
<div class="toolIcon">&#x1F50D;</div>
<div class="toolInfo">
<code>read_section</code>
<p>read a specific section by heading (e.g. <code>team</code>, <code>decisions</code>).</p>
</div>
</div>
<div class="toolCard">
<div class="toolIcon">&#x270F;&#xFE0F;</div>
<div class="toolInfo">
<code>update_section</code>
<p>propose an update to any section &mdash; creates a pull request.</p>
</div>
</div>
<div class="toolCard">
<div class="toolIcon">&#x1F50E;</div>
<div class="toolInfo">
<code>search_context</code>
<p>search across organisation.md and all context files.</p>
</div>
</div>
<div class="toolCard">
<div class="toolIcon">&#x1F4DD;</div>
<div class="toolInfo">
<code>propose_change</code>
<p>propose a change to any tracked file &mdash; creates a pr.</p>
</div>
</div>
<div class="toolCard">
<div class="toolIcon">&#x1F4C1;</div>
<div class="toolInfo">
<code>list_context_files</code>
<p>list all files in the context directory.</p>
</div>
</div>
<div class="toolCard">
<div class="toolIcon">&#x1F4E5;</div>
<div class="toolInfo">
<code>import_file</code>
<p>import a txt, md, or docx file into the knowledge base.</p>
</div>
</div>
<div class="toolCard">
<div class="toolIcon">&#x2795;</div>
<div class="toolInfo">
<code>add_info</code>
<p>add info via natural language &mdash; auto-detects the section.</p>
</div>
</div>
<div class="toolCard">
<div class="toolIcon">&#x2796;</div>
<div class="toolInfo">
<code>remove_info</code>
<p>remove info via natural language &mdash; auto-detects what to remove.</p>
</div>
</div>
<div class="toolCard">
<div class="toolIcon">&#x1F6E1;&#xFE0F;</div>
<div class="toolInfo">
<code>check_roles</code>
<p>check which users can modify which files.</p>
</div>
</div>
<div class="toolCard">
<div class="toolIcon">&#x1F511;</div>
<div class="toolInfo">
<code>check_permissions</code>
<p>check a user&rsquo;s permissions across the repo.</p>
</div>
</div>
<div class="toolCard">
<div class="toolIcon">&#x1F4CB;</div>
<div class="toolInfo">
<code>configure_codeowners</code>
<p>set up codeowners for path-level access control.</p>
</div>
</div>
<div class="toolCard">
<div class="toolIcon">&#x1F41B;</div>
<div class="toolInfo">
<code>report_bug</code>
<p>auto-detect the area and file a github issue.</p>
</div>
</div>
<div class="toolCard">
<div class="toolIcon">&#x1F4A1;</div>
<div class="toolInfo">
<code>suggest_feature</code>
<p>suggest a feature &mdash; creates a github issue automatically.</p>
</div>
</div>
</div>
</div>
</section>

<section class="section">
<div class="sectionInner">
<div class="sectionLabel">setup</div>
<h2 class="sectionTitle">from zero to running in 30 seconds</h2>
<p class="sectionSub">one environment variable. one npx command. no database setup, no deployment pipeline.</p>

<div class="qsGrid">
<div class="qsCard">
<div class="qsCardHeader">
<div class="qsDot"></div>
<div class="qsDot"></div>
<div class="qsDot"></div>
</div>
<div class="qsCardBody"><span class="cm"># generate a pat and export it</span>
export <span class="hl">github_token</span>=ghp_your_token
export <span class="hl">github_owner</span>=your-org
export <span class="hl">github_repo</span>=organisation.md

<span class="cm"># run with npx</span>
npx @shashank-sn/organisation-md</div>
</div>

<div class="qsCard">
<div class="qsCardHeader">
<div class="qsDot"></div>
<div class="qsDot"></div>
<div class="qsDot"></div>
</div>
<div class="qsCardBody"><span class="cm"># or clone and run</span>
git clone https://github.com/<span class="hl">your-org</span>/organisation.md
cd organisation.md
npm install

<span class="cm"># start the server</span>
npx tsx src/server.ts</div>
</div>
</div>

<div class="qsGrid" style="margin-top:1rem">
<div class="qsCard">
<div class="qsCardHeader">
<div class="qsDot"></div>
<div class="qsDot"></div>
<div class="qsDot"></div>
</div>
<div class="qsCardBody"><span class="cm"># add to your .mcp.json</span>
{
  "mcpServers": {
    "organisation.md": {
      "command": "npx",
      "args": ["@shashank-sn/organisation-md"],
      "env": {
        "github_token": "ghp_...",
        "github_owner": "your-org",
        "github_repo": "organisation.md"
      }
    }
  }
}</div>
</div>

<div class="qsCard">
<div class="qsCardHeader">
<div class="qsDot"></div>
<div class="qsDot"></div>
<div class="qsDot"></div>
</div>
<div class="qsCardBody"><span class="cm"># connect and read your context</span>
<span class="fn">read_org</span> → your full organisation.md
<span class="fn">read_section</span> team → your team section
<span class="fn">search_context</span> "decisions" → matching entries
<span class="fn">update_section</span> projects → creates a pr</div>
</div>
</div>

<div style="margin-top:1.5rem;padding:1rem 1.25rem;background:${T.accentLight};border-radius:8px;border:1px solid ${T.accent};font-size:.8125rem;color:${T.accentDark}">
<strong>need help?</strong> see the <a href="./docs/quickstart.html" style="text-decoration:underline">full quickstart guide</a>, or check the <a href="./docs/example-flows.html" style="text-decoration:underline">example workflows</a>.
</div>
</div>
</section>

<section class="section sectionAlt">
<div class="sectionInner">
<div class="sectionLabel">import &amp; manage</div>
<h2 class="sectionTitle">bring your own files</h2>
<p class="sectionSub">upload folders of <code>.txt</code>, <code>.md</code>, or <code>.docx</code> files. the server parses them, creates context entries, and updates <code>organisation.md</code> as your navigation index.</p>
<div class="featureGrid">
<div class="featureCard">
<span class="icon">&#x1F4C2;</span>
<h3>folder upload</h3>
<p>point the server at a folder of files. every <code>.txt</code>, <code>.md</code>, and <code>.docx</code> file becomes a context entry under <code>context/</code>.</p>
<div class="tags">
<span>.txt</span>
<span>.md</span>
<span>.docx</span>
</div>
</div>
<div class="featureCard">
<span class="icon">&#x1F4AC;</span>
<h3>natural language crud</h3>
<p>add, edit, or remove information by speaking naturally. the server parses your intent and updates the right files.</p>
<div class="tags">
<span>ai-powered</span>
<span>pr-based</span>
</div>
</div>
<div class="featureCard">
<span class="icon">&#x1F511;</span>
<h3>role-based access</h3>
<p>control who can add, delete, or approve changes through git itself &mdash; codeowners, branch protection, and commit signing.</p>
<div class="tags">
<span>git-native</span>
<span>team-ready</span>
</div>
</div>
</div>

<div style="margin-top:2rem">
<div class="fileTree">
<div class="dir">organisation.md/</div>
<div class="indent"><span class="hl">organisation.md</span> <span class="file"># your navigation index</span></div>
<div class="indent">
  <span class="dir">context/</span>
  <div class="indent"><span class="file">projects.md</span></div>
  <div class="indent"><span class="file">architecture.md</span></div>
  <div class="indent"><span class="file">people.md</span></div>
  <div class="indent"><span class="file" style="color:${T.accent}">+ your uploaded files here</span></div>
</div>
<div class="indent"><span class="dir">src/</span></div>
<div class="indent"><span class="dir">docs/</span></div>
</div>
</div>
</div>
</section>

<section class="section">
<div class="sectionInner">
<div class="sectionLabel">repository</div>
<h2 class="sectionTitle">everything in one place</h2>
<p class="sectionSub">the repo structure is designed to grow with your team. start with the template, add context files as you go.</p>
<div class="repoGrid">
<div class="repoCard">
<h3>organisation.md</h3>
<p>canonical context file &mdash; identity, mission, team, projects, decisions, and more.</p>
</div>
<div class="repoCard">
<h3>context/</h3>
<p>supporting docs for projects, architecture, people, and anything else that deserves its own file.</p>
</div>
<div class="repoCard">
<h3>src/</h3>
<p>typescript mcp server with octokit integration, markdown parser, and tool implementations.</p>
</div>
<div class="repoCard">
<h3>docs/</h3>
<p>quickstart guide, agent prompt template, example flows, and product strategy.</p>
</div>
</div>
<div class="linkBar">
<a href="./organisation.html"><span>&#x1F4C4;</span> view organisation context</a>
<a href="./strategy.html"><span>&#x1F3AF;</span> view strategy</a>
<a href="https://github.com/shashank-sn/organisation.md"><span>&#x1F419;</span> view on github</a>
</div>
</div>
</section>`;
  return wrapPage("organisation.md", body);
}


// =========================================================================
// content pages
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
    { src: "docs/quickstart.md", title: "quickstart" },
    { src: "docs/agent-prompt.md", title: "agent prompt" },
    { src: "docs/example-flows.md", title: "example flows" },
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
      // skip if file doesn't exist
    }
  }
}


// =========================================================================
// execute
// =========================================================================

writeFileSync(`${SITE_DIR}/index.html`, buildIndex());
writeFileSync(`${SITE_DIR}/README.html`, buildContentPage("README.md", "readme"));
writeFileSync(`${SITE_DIR}/organisation.html`, buildContentPage("organisation.md", "organisation context"));
writeFileSync(`${SITE_DIR}/strategy.html`, buildContentPage("STRATEGY.md", "strategy"));
buildDocsPages();
try { cpSync("CONTEXT", `${SITE_DIR}/CONTEXT`, { recursive: true }); } catch {}

console.log("site built in _site/");
