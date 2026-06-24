import type { Octokit } from "octokit";
import type { GraphEntry, RelatedEntry } from "./types.js";
import { readFile, listDirectory } from "../github/files.js";
import { getTitle } from "./parser.js";

interface ParsedMeta {
  date?: string;
  status?: string;
  related: string[];
  type?: string;
}

function parseMeta(content: string): ParsedMeta {
  const body = (() => {
    const match = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (!match) return content;
    return match[1];
  })();

  const date = body.match(/^date:\s*(.+)$/m)?.[1]?.trim();
  const status = body.match(/^status:\s*(.+)$/m)?.[1]?.trim();
  const type = body.match(/^type:\s*(.+)$/m)?.[1]?.trim();

  // Parse related field (array or single)
  const related: string[] = [];
  const relatedSection = body.match(/^related:\s*(.*)$/m);
  if (relatedSection) {
    const val = relatedSection[1].trim();
    if (val !== "[]" && val !== "") {
      // Check for inline list
      if (val.startsWith("- ")) {
        related.push(val.substring(2).trim());
      }
    }
    // Check for multiline array items
    const arrPattern = /^\s+-\s+(.+)$/gm;
    let arrMatch;
    while ((arrMatch = arrPattern.exec(body)) !== null) {
      related.push(arrMatch[1].trim());
    }
  }

  return { date, status, related: [...new Set(related)], type };
}

async function fetchMemoryFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  dir: string,
): Promise<Array<{ path: string; content: string }>> {
  const files: Array<{ path: string; content: string }> = [];
  try {
    const entries = await listDirectory(octokit, owner, repo, dir);
    for (const entry of entries) {
      if (entry.type !== "file") continue;
      try {
        const file = await readFile(octokit, owner, repo, entry.path);
        files.push({ path: entry.path, content: file.content });
      } catch {
        // Skip unreadable
      }
    }
  } catch {
    // Directory might not exist
  }
  return files;
}

export async function getRelated(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
): Promise<RelatedEntry[]> {
  const results: RelatedEntry[] = [];
  const targetPath = path.replace(/^\/+/, "");

  // 1. Get outbound links from the target file
  try {
    const file = await readFile(octokit, owner, repo, targetPath);
    const meta = parseMeta(file.content);
    const title = getTitle(file.content);

    for (const relatedPath of meta.related) {
      if (!relatedPath) continue;
      results.push({
        path: relatedPath,
        title: relatedPath.split("/").pop()?.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "") ?? relatedPath,
        type: relatedPath.includes("decision") ? "decision" : relatedPath.includes("session") ? "session" : "event",
        direction: "outbound",
      });
    }
  } catch {
    // Target file doesn't exist
    return results;
  }

  // 2. Scan all memory files for inbound links to targetPath
  const allFiles: Array<{ path: string; content: string }> = [];

  const decisionFiles = await fetchMemoryFiles(octokit, owner, repo, "CONTEXT/decisions");
  const sessionFiles = await fetchMemoryFiles(octokit, owner, repo, "CONTEXT/sessions");
  allFiles.push(...decisionFiles, ...sessionFiles);

  // Scan events directory for inbound links
  const eventFiles = await fetchMemoryFiles(octokit, owner, repo, "CONTEXT/events");
  for (const file of eventFiles) {
    const meta = parseMeta(file.content);
    if (meta.related.includes(targetPath)) {
      const title = getTitle(file.content);
      results.push({
        path: file.path,
        title,
        type: "event",
        direction: "inbound",
        date: meta.date,
      });
    }
  }

  for (const file of allFiles) {
    const meta = parseMeta(file.content);
    if (meta.related.includes(targetPath)) {
      const title = getTitle(file.content);
      const inferredType = file.path.includes("/decisions/") ? "decision" as const
        : file.path.includes("/sessions/") ? "session" as const
        : "event" as const;
      results.push({
        path: file.path,
        title,
        type: inferredType,
        direction: "inbound",
        date: meta.date,
        status: meta.status,
      });
    }
  }

  return results;
}

export async function getMemoryGraph(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<{ decisions: GraphEntry[]; sessions: GraphEntry[]; events: GraphEntry[] }> {
  const decisions: GraphEntry[] = [];
  const sessions: GraphEntry[] = [];

  const decisionFiles = await fetchMemoryFiles(octokit, owner, repo, "CONTEXT/decisions");
  for (const file of decisionFiles) {
    const meta = parseMeta(file.content);
    const title = getTitle(file.content);
    decisions.push({
      path: file.path,
      title,
      type: "decision",
      related: meta.related,
      date: meta.date ?? "",
      status: meta.status,
    });
  }

  const sessionFiles = await fetchMemoryFiles(octokit, owner, repo, "CONTEXT/sessions");
  for (const file of sessionFiles) {
    const meta = parseMeta(file.content);
    const title = getTitle(file.content);
    sessions.push({
      path: file.path,
      title,
      type: "session",
      related: meta.related,
      date: meta.date ?? "",
      status: meta.status,
    });
  }

  // Enumerate events directory
  const events: GraphEntry[] = [];
  const eventFiles = await fetchMemoryFiles(octokit, owner, repo, "CONTEXT/events");
  for (const file of eventFiles) {
    const meta = parseMeta(file.content);
    const title = getTitle(file.content);
    events.push({
      path: file.path,
      title,
      type: "event",
      related: meta.related,
      date: meta.date ?? "",
    });
  }

  return { decisions, sessions, events };
}

export async function getEntry(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
): Promise<string | null> {
  try {
    const file = await readFile(octokit, owner, repo, path);
    return file.content;
  } catch {
    return null;
  }
}
