import type { DecisionEntry, SessionEntry, EventEntry } from "./types.js";

const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n/;

export function slugify(text: string): string {
  if (!text || text.trim().length === 0) {
    return Date.now().toString(36);
  }
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60) || "entry";
}

export function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(FRONTMATTER_PATTERN);
  if (!match) return {};

  const raw = match[1];
  const result: Record<string, unknown> = {};
  const lines = raw.split("\n");
  let currentKey = "";
  let currentArray: string[] = [];

  for (const line of lines) {
    const arrayItem = line.match(/^\s+-\s+(.+)$/);
    if (arrayItem) {
      currentArray.push(arrayItem[1].trim());
      continue;
    }

    if (currentArray.length > 0 && currentKey) {
      result[currentKey] = currentArray;
      currentArray = [];
      currentKey = "";
    }

    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const val = kv[2].trim();
      if (val === "[]" || val === "") {
        currentArray = [];
        result[currentKey] = [];
      } else if (val === "true") {
        result[currentKey] = true;
      } else if (val === "false") {
        result[currentKey] = false;
      } else if (/^\d+$/.test(val)) {
        result[currentKey] = parseInt(val, 10);
      } else {
        result[currentKey] = val;
      }
    }
  }

  if (currentArray.length > 0 && currentKey) {
    result[currentKey] = currentArray;
  }

  return result;
}

export function getBody(content: string): string {
  const match = content.match(FRONTMATTER_PATTERN);
  if (!match) return content;
  return content.slice(match[0].length).trim();
}

export function getTitle(content: string): string {
  const body = getBody(content);
  const firstLine = body.split("\n")[0];
  const heading = firstLine?.match(/^#\s+(.+)$/);
  return heading ? heading[1].trim() : "Untitled";
}


