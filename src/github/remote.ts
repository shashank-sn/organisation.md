import type { Octokit } from "octokit";

let cached: boolean | null = null;

/**
 * Detect whether the repo remote is GitHub-hosted.
 * Caches only `true` — a transient failure never poisons the cache.
 */
export async function isGitHubHosted(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<boolean> {
  if (cached !== null) return cached;

  try {
    await octokit.rest.repos.get({ owner, repo });
    cached = true;
    return true;
  } catch (error) {
    const err = error as { status?: number };
    // 404 means the repo doesn't exist on GitHub — treat as non-GitHub
    // but don't cache it (transient network issues could cause false 404s)
    if (err.status === 404) return false;
    // Any other error (timeout, 5xx, rate limit) — don't cache, assume GitHub-hosted
    return true;
  }
}

/** Reset the cached result (for testing). */
export function resetRemoteCache(): void {
  cached = null;
}
