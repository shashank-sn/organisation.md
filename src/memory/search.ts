import type { Octokit } from "octokit";
import type { SearchResult } from "./types.js";
import { readFile, listDirectory } from "../github/files.js";
import { parseDocument } from "../content/parser.js";
import { getTitle } from "./parser.js";
import { parseFrontmatter } from "./parser.js";

export interface SearchOptions {
  query: string;
  status?: string;
  type?: string;
  date_from?: string;
  date_to?: string;
  search_in?: ("org" | "context" | "decisions" | "sessions" | "events")[];
}

export interface SearchMatch {
  file: string;
  title: string;
  snippet: string;
  type: "decision" | "session" | "event" | "org" | "context";
  status?: string;
  date?: string;
}

function findSnippet(content: string, query: string): string {
  const lower = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lower.indexOf(lowerQuery);
  if (idx === -1) return content.substring(0, 200);

  const start = Math.max(0, idx - 50);
  const end = Math.min(content.length, idx + query.length + 100);
  let snippet = content.substring(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";
  return snippet;
}

function extractTitleAndMeta(content: string): { title: string; status?: string; date?: string } {
  const title = getTitle(content);
  const fm = parseFrontmatter(content);

  return {
    title,
    status: typeof fm.status === "string" ? fm.status : undefined,
    date: typeof fm.date === "string" ? fm.date : undefined,
  };
}

function matchesDateFilter(dateStr: string | undefined, date_from?: string, date_to?: string): boolean {
  if (!dateStr) return true;
  if (date_from && dateStr < date_from) return false;
  if (date_to && dateStr > date_to) return false;
  return true;
}

export async function searchMemory(
  octokit: Octokit,
  owner: string,
  repo: string,
  options: SearchOptions,
): Promise<SearchMatch[]> {
  const results: SearchMatch[] = [];
  const lowerQuery = options.query.toLowerCase();
  const searchIn = options.search_in ?? ["org", "context", "decisions", "sessions", "events"];

  // Search organisation.md
  if (searchIn.includes("org")) {
    try {
      const orgFile = await readFile(octokit, owner, repo, "organisation.md");
      const doc = parseDocument(orgFile.content);

      for (const section of doc.sections) {
        if (section.content.toLowerCase().includes(lowerQuery)) {
          results.push({
            file: "organisation.md",
            title: section.heading,
            snippet: findSnippet(section.content, lowerQuery),
            type: "org",
          });
        }
      }
    } catch {
      // organisation.md might not exist
    }
  }

  // Search CONTEXT/ files (excluding memory stores)
  if (searchIn.includes("context")) {
    try {
      const files = await listDirectory(octokit, owner, repo, "CONTEXT");
      for (const file of files) {
        if (file.type !== "file") continue;
        if (file.path.startsWith("CONTEXT/decisions/") || file.path.startsWith("CONTEXT/sessions/")) continue;
        try {
          const content = await readFile(octokit, owner, repo, file.path);
          if (content.content.toLowerCase().includes(lowerQuery)) {
            results.push({
              file: file.path,
              title: file.name,
              snippet: findSnippet(content.content, lowerQuery),
              type: "context",
            });
          }
        } catch {
          // Skip unreadable files
        }
      }
    } catch {
      // CONTEXT/ might not exist
    }
  }

  // Search decision files
  if (searchIn.includes("decisions")) {
    try {
      const files = await listDirectory(octokit, owner, repo, "CONTEXT/decisions");
      for (const file of files) {
        if (file.type !== "file") continue;
        try {
          const content = await readFile(octokit, owner, repo, file.path);
          const { title, status, date } = extractTitleAndMeta(content.content);

          if (!matchesDateFilter(date, options.date_from, options.date_to)) continue;
          if (options.status && status !== options.status) continue;

          if (content.content.toLowerCase().includes(lowerQuery)) {
            results.push({
              file: file.path,
              title,
              snippet: findSnippet(content.content, lowerQuery),
              type: "decision",
              status,
              date,
            });
          }
        } catch {
          // Skip unreadable files
        }
      }
    } catch {
      // decisions/ might not exist yet
    }
  }

  // Search session files
  if (searchIn.includes("sessions")) {
    try {
      const files = await listDirectory(octokit, owner, repo, "CONTEXT/sessions");
      for (const file of files) {
        if (file.type !== "file") continue;
        try {
          const content = await readFile(octokit, owner, repo, file.path);
          const { title, status, date } = extractTitleAndMeta(content.content);

          if (!matchesDateFilter(date, options.date_from, options.date_to)) continue;

          if (content.content.toLowerCase().includes(lowerQuery)) {
            results.push({
              file: file.path,
              title,
              snippet: findSnippet(content.content, lowerQuery),
              type: "session",
              status,
              date,
            });
          }
        } catch {
          // Skip unreadable files
        }
      }
    } catch {
      // sessions/ might not exist yet
    }
  }

  // Search event files
  if (searchIn.includes("events")) {
    try {
      const files = await listDirectory(octokit, owner, repo, "CONTEXT/events");
      for (const file of files) {
        if (file.type !== "file") continue;
        try {
          const content = await readFile(octokit, owner, repo, file.path);
          const { title, date } = extractTitleAndMeta(content.content);

          if (!matchesDateFilter(date, options.date_from, options.date_to)) continue;

          if (content.content.toLowerCase().includes(lowerQuery)) {
            results.push({
              file: file.path,
              title,
              snippet: findSnippet(content.content, lowerQuery),
              type: "event",
              date,
            });
          }
        } catch {
          // Skip unreadable files
        }
      }
    } catch {
      // CONTEXT/events might not exist yet
    }
  }

  return results;
}
