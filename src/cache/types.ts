export interface CachedFile {
  content: string;
  sha: string;
  path: string;
  ref: string | null;
  cachedAt: number;
}
