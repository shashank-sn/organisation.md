import type { Octokit } from "octokit";
import { formatSession } from "./formatter.js";
import { slugify } from "./parser.js";
import { today, uniquePath } from "./utils.js";
import { createFile } from "../github/files.js";

export interface AddSessionInput {
  summary: string;
  decisions?: string[];
  open_questions?: string;
  related?: string[];
  slug?: string;
}

export interface AddSessionResult {
  path: string;
}

export async function addSession(
  octokit: Octokit,
  owner: string,
  repo: string,
  input: AddSessionInput,
): Promise<AddSessionResult> {
  const date = today();
  const slug = input.slug || slugify(input.summary);
  const path = `CONTEXT/sessions/${date}-${slug}.md`;

  const content = formatSession(
    {
      date,
      type: "session",
      summary: input.summary,
      decisions: input.decisions ?? [],
      open_questions: input.open_questions ?? "",
      related: input.related ?? [],
    },
    slug,
    date,
  );

  await createFile(
    octokit, owner, repo,
    path,
    content,
    "main",
    `feat(session): add session — ${slug}`,
  );

  return { path };
}
