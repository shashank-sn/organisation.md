import type { CachedFile } from "./types.js";

const HEAD_KEY = "HEAD";

/**
 * Build a cache key from a file path and optional ref.
 */
function cacheKey(path: string, ref: string | null): string {
  return `${path}:${ref ?? HEAD_KEY}`;
}

/**
 * In-memory file cache for GitHub API reads.
 *
 * Stores file contents by `path:ref` key. Lives for the lifetime of the
 * process (one MCP session). No TTL — the process is typically short-lived
 * and invalidation handles staleness on writes.
 *
 * Singleton module instance — import and use directly.
 */
class FileCache {
  private store = new Map<string, CachedFile>();

  get(path: string, ref?: string | null): CachedFile | undefined {
    return this.store.get(cacheKey(path, ref ?? null));
  }

  set(entry: CachedFile): void {
    this.store.set(cacheKey(entry.path, entry.ref), entry);
  }

  has(path: string, ref?: string | null): boolean {
    return this.store.has(cacheKey(path, ref ?? null));
  }

  invalidate(path: string, ref?: string | null): void {
    this.store.delete(cacheKey(path, ref ?? null));
  }

  invalidateAll(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

/** Singleton cache instance. */
export const fileCache = new FileCache();
