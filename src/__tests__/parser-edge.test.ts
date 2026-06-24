import { describe, it, expect } from "vitest";
import { parseDocument, replaceSection } from "../content/parser.js";

const FRONTMATTER_ONLY = `---
key: value
---`;

const NESTED_SECTIONS = `## Identity

**Name:** Org

### Sub-heading should be ignored

Nested content.

## Team

Members go here.

## Decisions

## Glossary

| Term | Def |
`;

const TRAILING_CONTENT = `## One

Content A

## Two

Content B

Some trailing text after the last section.
`;

describe("parser edge cases", () => {
  it("handles frontmatter without body sections", () => {
    const doc = parseDocument(FRONTMATTER_ONLY);
    expect(doc.frontmatter).toBe("key: value");
    expect(doc.sections).toHaveLength(0);
  });

  it("handles empty sections (no content after heading)", () => {
    const doc = parseDocument(NESTED_SECTIONS);
    const decisions = doc.sections.find((s) => s.heading === "Decisions");
    expect(decisions).toBeDefined();
    // Should have no content beyond the heading
    const lines = decisions!.content.split("\n").filter((l) => l.trim());
    expect(lines.length).toBe(1); // just "## Decisions"
  });

  it("includes trailing content in last section", () => {
    const doc = parseDocument(TRAILING_CONTENT);
    const two = doc.sections.find((s) => s.heading === "Two");
    expect(two).toBeDefined();
    expect(two!.content).toContain("trailing text");
  });

  it("replace section preserves nested markdown", () => {
    const doc = parseDocument(NESTED_SECTIONS);
    const updated = replaceSection(doc, "Identity", "**Name:** NewOrg\n\nSome new content.");
    expect(updated).toContain("**Name:** NewOrg");
    expect(updated).toContain("## Team");
    expect(updated).toContain("Members go here.");
  });

  it("handles section with colons in heading", () => {
    const markdown = "## Mission & Vision\n\nTo be the best.";
    const doc = parseDocument(markdown);
    expect(doc.sections).toHaveLength(1);
    expect(doc.sections[0].heading).toBe("Mission & Vision");
  });
});
