import { describe, it, expect, beforeEach } from "vitest";
import { fileCache } from "./index.js";

const SAMPLE_ENTRY = {
  content: "# Hello",
  sha: "abc123",
  path: "organisation.md",
  ref: null,
  cachedAt: Date.now(),
};

const SAMPLE_ENTRY_REF = {
  content: "# Hello from branch",
  sha: "def456",
  path: "organisation.md",
  ref: "feature-branch",
  cachedAt: Date.now(),
};

describe("FileCache", () => {
  beforeEach(() => {
    fileCache.invalidateAll();
  });

  it("returns undefined when cache is empty", () => {
    expect(fileCache.get("nonexistent.md")).toBeUndefined();
  });

  it("stores and retrieves an entry", () => {
    fileCache.set(SAMPLE_ENTRY);
    const result = fileCache.get("organisation.md");
    expect(result).toBeDefined();
    expect(result!.content).toBe("# Hello");
    expect(result!.sha).toBe("abc123");
  });

  it("returns correct entry after cache set", () => {
    fileCache.set(SAMPLE_ENTRY);
    expect(fileCache.has("organisation.md")).toBe(true);
  });

  it("caches same path with different refs separately", () => {
    fileCache.set(SAMPLE_ENTRY);
    fileCache.set(SAMPLE_ENTRY_REF);

    const defaultEntry = fileCache.get("organisation.md");
    const refEntry = fileCache.get("organisation.md", "feature-branch");

    expect(defaultEntry!.content).toBe("# Hello");
    expect(refEntry!.content).toBe("# Hello from branch");
    expect(fileCache.size).toBe(2);
  });

  it("cache key includes ref — null and specific ref are distinct", () => {
    fileCache.set(SAMPLE_ENTRY); // ref: null → HEAD
    fileCache.set(SAMPLE_ENTRY_REF); // ref: "feature-branch"

    // HEAD and null should be the same
    expect(fileCache.get("organisation.md", null)).toBeDefined();
    expect(fileCache.get("organisation.md", "HEAD")).toBeDefined();
  });

  it("invalidate removes a specific entry", () => {
    fileCache.set(SAMPLE_ENTRY);
    expect(fileCache.has("organisation.md")).toBe(true);

    fileCache.invalidate("organisation.md");
    expect(fileCache.has("organisation.md")).toBe(false);
  });

  it("invalidate only removes the matching ref", () => {
    fileCache.set(SAMPLE_ENTRY);
    fileCache.set(SAMPLE_ENTRY_REF);

    fileCache.invalidate("organisation.md");

    expect(fileCache.has("organisation.md")).toBe(false);
    expect(fileCache.has("organisation.md", "feature-branch")).toBe(true);
  });

  it("invalidateAll clears everything", () => {
    fileCache.set(SAMPLE_ENTRY);
    fileCache.set(SAMPLE_ENTRY_REF);
    expect(fileCache.size).toBe(2);

    fileCache.invalidateAll();
    expect(fileCache.size).toBe(0);
    expect(fileCache.has("organisation.md")).toBe(false);
  });
});
