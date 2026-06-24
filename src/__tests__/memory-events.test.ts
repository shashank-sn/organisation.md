import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the GitHub files module so we don't hit the real API
vi.mock("../github/files.js", () => ({
  readFile: vi.fn(),
  createFile: vi.fn(),
}));

import { addEvent } from "../memory/events.js";
import { formatEvent } from "../memory/formatter.js";
import { parseFrontmatter, getTitle } from "../memory/parser.js";
import { readFile, createFile } from "../github/files.js";

const mockOctokit = {} as any;

describe("addEvent — write flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new file when no collision exists", async () => {
    // Simulate no existing file at the target path
    vi.mocked(readFile).mockRejectedValueOnce(new Error("Not found"));

    await addEvent(mockOctokit, "test-owner", "test-repo", {
      type: "milestone",
      description: "First release",
    });

    // Should have called createFile with the right path pattern
    expect(vi.mocked(createFile)).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(createFile).mock.calls[0];
    const path = callArgs[3] as string;

    // Path should be CONTEXT/events/{date}-{slug}.md
    expect(path).toMatch(/^CONTEXT\/events\/\d{4}-\d{2}-\d{2}-first-release\.md$/);
  });

  it("appends dedup suffix on path collision", async () => {
    // First call to readFile from uniquePath: file exists → reject (404 for no-match) → wait, uniquePath repeatedly calls readFile until not-found
    // Simulate first attempt: file exists → resolve (exists)
    // We need to make readFile succeed on first attempt (file exists) then fail (not found) for the dedup
    vi.mocked(readFile)
      .mockResolvedValueOnce({ content: "exists", sha: "abc", path: "CONTEXT/events/2026-06-24-first-release.md" })
      .mockRejectedValueOnce(new Error("Not found"));

    await addEvent(mockOctokit, "test-owner", "test-repo", {
      type: "milestone",
      description: "First release",
    });

    // Should have created file with -2 suffix
    expect(vi.mocked(createFile)).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(createFile).mock.calls[0];
    const path = callArgs[3] as string;
    expect(path).toMatch(/-2\.md$/);
  });

  it("produces valid frontmatter that round-trips", async () => {
    vi.mocked(readFile).mockRejectedValueOnce(new Error("Not found"));

    // Capture what would be written
    let writtenContent = "";
    vi.mocked(createFile).mockImplementation(async (_octokit: any, _owner: string, _repo: string, _path: string, content: string) => {
      writtenContent = content;
    });

    await addEvent(mockOctokit, "test-owner", "test-repo", {
      type: "release",
      description: "v2.0 deployed",
      related: ["CONTEXT/decisions/2026-06-24-use-typescript.md"],
    });

    // Verify round-trip: write → parse → read
    const fm = parseFrontmatter(writtenContent);
    expect(fm.type).toBe("release");
    expect(fm.description).toBe("v2.0 deployed");
    expect(fm.related).toContain("CONTEXT/decisions/2026-06-24-use-typescript.md");
    expect(getTitle(writtenContent)).toContain("release");
  });
});

describe("formatEvent — output structure", () => {
  it("produces valid YAML frontmatter with all fields", () => {
    const result = formatEvent(
      { date: "2026-06-24", type: "milestone", description: "Launch", related: [] },
      "launch",
      "2026-06-24",
    );

    expect(result.startsWith("---\n")).toBe(true);
    expect(result).toContain("date: 2026-06-24");
    expect(result).toContain("type: milestone");
    expect(result).toContain("description: Launch");
    expect(result).toContain("related: []");
  });

  it("includes related paths as bullet list in frontmatter", () => {
    const result = formatEvent(
      {
        date: "2026-06-24",
        type: "release",
        description: "v2.0",
        related: ["CONTEXT/decisions/a.md", "CONTEXT/decisions/b.md"],
      },
      "v20",
      "2026-06-24",
    );

    expect(result).toContain("  - CONTEXT/decisions/a.md");
    expect(result).toContain("  - CONTEXT/decisions/b.md");
  });

  it("includes event description as body", () => {
    const result = formatEvent(
      { date: "2026-06-24", type: "meeting", description: "Sprint planning session" },
      "sprint-planning",
      "2026-06-24",
    );

    expect(result).toContain("# meeting — 2026-06-24");
    expect(result).toContain("Sprint planning session");
  });
});
