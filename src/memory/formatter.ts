import type { DecisionEntry, SessionEntry, EventEntry } from "./types.js";

export function formatDecision(entry: DecisionEntry, slug: string, date: string): string {
  const frontmatter = [
    "---",
    `date: ${date}`,
    `status: ${entry.status}`,
    `type: decision`,
    `decided_by: ${entry.decided_by}`,
    `related:${entry.related.length === 0 ? " []" : ""}`,
    ...entry.related.map((r) => `  - ${r}`),
    "---",
    "",
  ].join("\n");

  const body = [
    `# ${entry.body.decision}`,
    "",
    "## Context",
    "",
    entry.body.context,
    "",
    "## Decision",
    "",
    entry.body.decision,
    "",
    "## Rationale",
    "",
    entry.body.rationale,
    "",
    "## Alternatives Considered",
    "",
    entry.body.alternatives,
    "",
  ].join("\n");

  return frontmatter + body;
}

export function formatSession(entry: SessionEntry, _slug: string, date: string): string {
  const frontmatter = [
    "---",
    `date: ${date}`,
    `type: session`,
    `decisions:${entry.decisions.length === 0 ? " []" : ""}`,
    ...entry.decisions.map((d) => `  - ${d}`),
    `related:${entry.related.length === 0 ? " []" : ""}`,
    ...entry.related.map((r) => `  - ${r}`),
    "---",
    "",
  ].join("\n");

  const body = [
    `# ${entry.summary}`,
    "",
    entry.summary,
    "",
    "## Decisions Made",
    "",
    ...(entry.decisions.length > 0
      ? entry.decisions.map((d) => `- ${d}`)
      : ["None recorded."]),
    "",
    "## Open Questions",
    "",
    entry.open_questions,
    "",
  ].join("\n");

  return frontmatter + body;
}

export function formatEvent(entry: EventEntry, slug: string, date: string): string {
  const frontmatter = [
    "---",
    `date: ${date}`,
    `type: ${entry.type}`,
    `description: ${entry.description}`,
    `related:${entry.related && entry.related.length > 0 ? "" : " []"}`,
    ...(entry.related ?? []).map((r) => `  - ${r}`),
    "---",
    "",
  ].join("\n");

  const body = [
    `# ${entry.type} — ${date}`,
    "",
    entry.description,
    "",
  ].join("\n");

  return frontmatter + body;
}
