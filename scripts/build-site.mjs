#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import { marked } from "marked";

const SITE_DIR = "_site";

// Ensure output directories
mkdirSync(`${SITE_DIR}/docs`, { recursive: true });
mkdirSync(`${SITE_DIR}/CONTEXT`, { recursive: true });

const PAGES = [
  { src: "README.md", title: "organisation.md" },
  { src: "organisation.md", title: "Organisation Context" },
  { src: "STRATEGY.md", title: "Strategy" },
];

function buildPage(src, title) {
  const md = readFileSync(src, "utf-8");
  const body = marked.parse(md, { gfm: true });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — organisation.md</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/sindresorhus/github-markdown-css@main/github-markdown.css">
  <style>
    body { max-width: 860px; margin: 0 auto; padding: 2rem 1.5rem; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Noto Sans, Helvetica, Arial, sans-serif; }
    .markdown-body { box-sizing: border-box; min-width: 200px; max-width: 860px; }
    @media (max-width: 767px) { .markdown-body { padding: 15px; } }
  </style>
</head>
<body>
  <div class="markdown-body">
${body}
  </div>
</body>
</html>`;

  const outPath = `${SITE_DIR}/${src.replace(/\.md$/, ".html")}`;
  writeFileSync(outPath, html);

  // Link README.html as index.html
  if (src === "README.md") {
    writeFileSync(`${SITE_DIR}/index.html`, html);
  }
}

// Convert markdown pages
for (const page of PAGES) {
  buildPage(page.src, page.title);
}

// Copy docs/ and CONTEXT/ as markdown (accessible via direct links)
cpSync("docs", `${SITE_DIR}/docs`, { recursive: true });
cpSync("CONTEXT", `${SITE_DIR}/CONTEXT`, { recursive: true });

console.log("Site built in _site/");
