import type { Octokit } from "octokit";

/**
 * Initialize the memory layer.
 *
 * Event, decision, and session directories are created implicitly by the
 * GitHub Contents API when the first file is created in them — no explicit
 * directory creation is needed.
 */
export async function ensureMemoryLayer(
  _octokit: Octokit,
  _owner: string,
  _repo: string,
): Promise<void> {
  // Memory stores self-initialize on first write — nothing to do here.
}
