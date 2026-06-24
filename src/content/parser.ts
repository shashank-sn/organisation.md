import type { Section, ParsedDocument } from "./types.js";

const HEADING_PATTERN = /^##\s+(.+)$/gm;
const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n?/;

export function parseDocument(markdown: string): ParsedDocument {
  const frontmatter = extractFrontmatter(markdown);
  const body = frontmatter
    ? markdown.replace(FRONTMATTER_PATTERN, "")
    : markdown;

  const sections: Section[] = [];
  const lines = body.split("\n");
  let currentHeading: string | null = null;
  let currentStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^##\s+(.+)$/);
    if (match) {
      if (currentHeading !== null) {
        sections.push({
          heading: currentHeading,
          content: lines.slice(currentStart, i).join("\n"),
          startLine: currentStart,
          endLine: i - 1,
        });
      }
      currentHeading = match[1].trim();
      currentStart = i;
    }
  }

  if (currentHeading !== null) {
    sections.push({
      heading: currentHeading,
      content: lines.slice(currentStart).join("\n"),
      startLine: currentStart,
      endLine: lines.length - 1,
    });
  }

  return {
    sections,
    raw: markdown,
    frontmatter,
  };
}

export function extractFrontmatter(markdown: string): string | null {
  const match = markdown.match(FRONTMATTER_PATTERN);
  return match ? match[1] : null;
}

export function getSection(doc: ParsedDocument, heading: string): Section | undefined {
  return doc.sections.find(
    (s) => s.heading.toLowerCase() === heading.toLowerCase(),
  );
}

export function replaceSection(
  doc: ParsedDocument,
  heading: string,
  newContent: string,
): string {
  const section = getSection(doc, heading);
  if (!section) {
    throw new Error(`Section "${heading}" not found`);
  }

  const lines = doc.raw.split("\n");
  const before = lines.slice(0, section.startLine);
  const after = lines.slice(section.endLine + 1);

  const header = lines[section.startLine];
  const replacement = [header, "", newContent.trim(), ""].join("\n");

  return [...before, replacement, ...after].join("\n");
}

export function listSectionHeadings(doc: ParsedDocument): string[] {
  return doc.sections.map((s) => s.heading);
}
