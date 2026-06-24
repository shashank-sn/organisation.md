import type { Octokit } from "octokit";
import { formatEvent } from "./formatter.js";
import { slugify } from "./parser.js";
import { today, uniquePath } from "./utils.js";
import { createFile } from "../github/files.js";

export interface AddEventInput {
  type: string;
  description: string;
  related?: string[];
}

export interface AddEventResult {
  path: string;
}

export async function addEvent(
  octokit: Octokit,
  owner: string,
  repo: string,
  input: AddEventInput,
): Promise<AddEventResult> {
  const date = today();
  const slug = slugify(input.description);
  const path = await uniquePath(octokit, owner, repo, `CONTEXT/events/${date}-${slug}.md`);
  const content = formatEvent(
    { date, type: input.type, description: input.description, related: input.related },
    slug,
    date,
  );

  await createFile(
    octokit, owner, repo,
    path, content, "main",
    `feat(event): ${input.type} — ${input.description.substring(0, 60)}`,
  );

  return { path };
}
