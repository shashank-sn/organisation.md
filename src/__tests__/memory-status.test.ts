import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../github/files.js", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

import { updateEntryStatus } from "../memory/status.js";
import { readFile, writeFile } from "../github/files.js";

const mockOctokit = {} as any;

const MOCK_DECISION = `---
date: 2026-06-24
status: proposed
type: decision
decided_by: Alice
related: []
---

# Use TypeScript

We decided to use TypeScript.
`;

describe("updateEntryStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-decision paths", async () => {
    const result = await updateEntryStatus(mockOctokit, "owner", "repo", {
      path: "CONTEXT/sessions/2026-06-24-review.md",
      status: "accepted",
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain("Only decision files");
  });

  it("returns error on missing file", async () => {
    vi.mocked(readFile).mockRejectedValueOnce(new Error("Not found"));

    const result = await updateEntryStatus(mockOctokit, "owner", "repo", {
      path: "CONTEXT/decisions/2026-06-24-nonexistent.md",
      status: "accepted",
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain("File not found");
  });

  it("transitions proposed → accepted", async () => {
    vi.mocked(readFile).mockResolvedValueOnce({ content: MOCK_DECISION, sha: "abc123", path: "CONTEXT/decisions/2026-06-24-use-typescript.md" });

    const result = await updateEntryStatus(mockOctokit, "owner", "repo", {
      path: "CONTEXT/decisions/2026-06-24-use-typescript.md",
      status: "accepted",
    });
    expect(result.success).toBe(true);
    expect(result.message).toContain("accepted");

    // Verify the content was updated correctly
    expect(vi.mocked(writeFile)).toHaveBeenCalledTimes(1);
    const writtenContent = vi.mocked(writeFile).mock.calls[0][4] as string;
    expect(writtenContent).toContain("status: accepted");
  });

  it("rejects invalid transitions", async () => {
    vi.mocked(readFile).mockResolvedValueOnce({ content: MOCK_DECISION, sha: "abc123", path: "CONTEXT/decisions/2026-06-24-use-typescript.md" });

    const result = await updateEntryStatus(mockOctokit, "owner", "repo", {
      path: "CONTEXT/decisions/2026-06-24-use-typescript.md",
      status: "proposed",
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain("Cannot transition");
    expect(result.message).toContain("proposed");
  });

  it("accepts reason parameter", async () => {
    vi.mocked(readFile).mockResolvedValueOnce({ content: MOCK_DECISION, sha: "abc123", path: "CONTEXT/decisions/2026-06-24-use-typescript.md" });

    const result = await updateEntryStatus(mockOctokit, "owner", "repo", {
      path: "CONTEXT/decisions/2026-06-24-use-typescript.md",
      status: "accepted",
      reason: "Team agreed in standup",
    });
    expect(result.success).toBe(true);

    // Commit message should include the reason
    const commitMessage = vi.mocked(writeFile).mock.calls[0][7] as string;
    expect(commitMessage).toContain("standup");
  });
});
