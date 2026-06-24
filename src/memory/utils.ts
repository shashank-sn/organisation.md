import type { Octokit } from "octokit";
import { readFile } from "../github/files.js";

/** Shared utility functions for the memory layer. */

export function today(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Generate a unique file path by checking existence and appending a dedup suffix.
 * If `path.md` exists, tries `path-2.md`, `path-3.md`, etc.
 */
export async function uniquePath(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
): Promise<string> {
  // Trim .md so we can suffix before it
  const base = path.replace(/\.md$/, "");
  const ext = ".md";

  for (let attempt = 0; attempt < 100; attempt++) {
    const candidate = attempt === 0 ? `${base}${ext}` : `${base}-${attempt + 1}${ext}`;
    try {
      await readFile(octokit, owner, repo, candidate);
      // Exists — try next suffix
      continue;
    } catch {
      // Not found — this path is available
      return candidate;
    }
  }

  // Extremely unlikely: 100 collisions on the same slug
  return `${base}-${Date.now()}${ext}`;
}
