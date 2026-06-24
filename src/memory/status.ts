import type { Octokit } from "octokit";
import type { DecisionStatus } from "./types.js";
import { parseFrontmatter } from "./parser.js";
import { readFile, writeFile } from "../github/files.js";

const VALID_TRANSITIONS: Record<DecisionStatus, DecisionStatus[]> = {
  proposed: ["accepted", "superseded"],
  accepted: ["superseded"],
  superseded: [],
};

export interface UpdateStatusInput {
  path: string;
  status: DecisionStatus;
  reason?: string;
}

export interface UpdateStatusResult {
  success: boolean;
  message: string;
}

export async function updateEntryStatus(
  octokit: Octokit,
  owner: string,
  repo: string,
  input: UpdateStatusInput,
): Promise<UpdateStatusResult> {
  // Validate path is a decision file
  if (!input.path.startsWith("CONTEXT/decisions/") || !input.path.endsWith(".md")) {
    return { success: false, message: "Only decision files in CONTEXT/decisions/ can have their status updated." };
  }

  // Fetch the current file
  let file: { content: string; sha: string };
  try {
    file = await readFile(octokit, owner, repo, input.path);
  } catch {
    return { success: false, message: `File not found: ${input.path}` };
  }

  // Parse current status from frontmatter
  const frontmatter = parseFrontmatter(file.content);
  const rawStatus = frontmatter.status;

  if (typeof rawStatus !== "string") {
    return { success: false, message: `Expected a string status in frontmatter, got ${typeof rawStatus === "undefined" ? "none" : typeof rawStatus}.` };
  }

  if (!(rawStatus in VALID_TRANSITIONS)) {
    return { success: false, message: `Unknown status "${rawStatus}". Valid statuses: proposed, accepted, superseded.` };
  }

  const currentStatus = rawStatus as DecisionStatus;
  const allowed = VALID_TRANSITIONS[currentStatus];

  if (!allowed.includes(input.status)) {
    return {
      success: false,
      message: `Cannot transition status from "${currentStatus}" to "${input.status}". Allowed transitions: ${allowed.length > 0 ? allowed.join(", ") : "none"}.`,
    };
  }

  // Update the status field
  const updatedContent = file.content.replace(
    /^status:\s*.+$/m,
    `status: ${input.status}`,
  );

  // Write back
  await writeFile(
    octokit, owner, repo,
    input.path,
    updatedContent,
    file.sha,
    "main",
    `chore(decision): update status to ${input.status}${input.reason ? ` — ${input.reason.substring(0, 60)}` : ""}`,
  );

  return { success: true, message: `Status updated to "${input.status}".` };
}
