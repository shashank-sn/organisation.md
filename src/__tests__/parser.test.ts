import { describe, it, expect } from "vitest";
import { parseDocument, getSection, replaceSection, listSectionHeadings } from "../content/parser.js";

const SAMPLE_ORG = `---
last_updated: 2026-06-24
---

## Identity

**Org name:** Acme Corp
**Description:** We make things.

## Team

| Name | Role |
|------|------|
| Alice | CEO |

## Decisions

No decisions recorded yet.
`;

describe("parseDocument", () => {
  it("parses sections from markdown", () => {
    const doc = parseDocument(SAMPLE_ORG);
    expect(doc.sections).toHaveLength(3);
    expect(doc.sections[0].heading).toBe("Identity");
    expect(doc.sections[1].heading).toBe("Team");
    expect(doc.sections[2].heading).toBe("Decisions");
  });

  it("extracts frontmatter", () => {
    const doc = parseDocument(SAMPLE_ORG);
    expect(doc.frontmatter).toContain("last_updated: 2026-06-24");
  });

  it("returns null frontmatter when absent", () => {
    const doc = parseDocument("## Identity\n\nContent");
    expect(doc.frontmatter).toBeNull();
  });

  it("handles empty content", () => {
    const doc = parseDocument("");
    expect(doc.sections).toHaveLength(0);
  });

  it("handles content with no sections", () => {
    const doc = parseDocument("Just some text without headings.");
    expect(doc.sections).toHaveLength(0);
  });

  it("preserves raw markdown", () => {
    const doc = parseDocument(SAMPLE_ORG);
    expect(doc.raw).toBe(SAMPLE_ORG);
  });
});

describe("getSection", () => {
  it("finds a section by heading", () => {
    const doc = parseDocument(SAMPLE_ORG);
    const section = getSection(doc, "Team");
    expect(section).toBeDefined();
    expect(section!.content).toContain("Alice");
  });

  it("is case-insensitive", () => {
    const doc = parseDocument(SAMPLE_ORG);
    const section = getSection(doc, "team");
    expect(section).toBeDefined();
    expect(section!.content).toContain("Alice");
  });

  it("returns undefined for unknown heading", () => {
    const doc = parseDocument(SAMPLE_ORG);
    const section = getSection(doc, "Nonexistent");
    expect(section).toBeUndefined();
  });
});

describe("replaceSection", () => {
  it("replaces a section and preserves others", () => {
    const doc = parseDocument(SAMPLE_ORG);
    const updated = replaceSection(doc, "Team", "**Everyone:** Bob");
    expect(updated).toContain("**Org name:** Acme Corp");
    expect(updated).toContain("**Everyone:** Bob");
    expect(updated).toContain("No decisions recorded yet");
  });

  it("preserves frontmatter", () => {
    const doc = parseDocument(SAMPLE_ORG);
    const updated = replaceSection(doc, "Team", "New content");
    expect(updated).toContain("last_updated");
  });

  it("throws for unknown section", () => {
    const doc = parseDocument(SAMPLE_ORG);
    expect(() => replaceSection(doc, "Unknown", "content")).toThrow();
  });
});

describe("listSectionHeadings", () => {
  it("returns all headings", () => {
    const doc = parseDocument(SAMPLE_ORG);
    expect(listSectionHeadings(doc)).toEqual(["Identity", "Team", "Decisions"]);
  });
});
