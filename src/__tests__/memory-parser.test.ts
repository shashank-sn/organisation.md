import { describe, it, expect } from "vitest";
import { slugify, parseFrontmatter, getTitle, getBody } from "../memory/parser.js";
import { formatDecision, formatSession, formatEvent } from "../memory/formatter.js";

// ── slugify ──

describe("slugify", () => {
  it("converts basic text to a slug", () => {
    expect(slugify("Use TypeScript For All New Projects")).toBe("use-typescript-for-all-new-projects");
  });

  it("handles special characters", () => {
    expect(slugify("Hello! What's #1?")).toBe("hello-whats-1");
  });

  it("trims and collapses whitespace", () => {
    expect(slugify("  too   many   spaces  ")).toBe("too-many-spaces");
  });

  it("limits length to 60 characters", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(60);
  });

  it("returns timestamp-based fallback for empty input", () => {
    const result = slugify("");
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});

// ── parseFrontmatter ──

describe("parseFrontmatter", () => {
  it("parses simple key-value pairs", () => {
    const content = "---\ndate: 2026-06-24\nstatus: proposed\n---\n\nBody";
    const fm = parseFrontmatter(content);
    expect(fm.date).toBe("2026-06-24");
    expect(fm.status).toBe("proposed");
  });

  it("parses array values", () => {
    const content = "---\nrelated:\n  - path/a.md\n  - path/b.md\n---\n\nBody";
    const fm = parseFrontmatter(content);
    expect(fm.related).toEqual(["path/a.md", "path/b.md"]);
  });

  it("returns empty object when no frontmatter", () => {
    expect(parseFrontmatter("Just content")).toEqual({});
  });

  it("parses boolean values", () => {
    const content = "---\nactive: true\narchived: false\n---\n\nBody";
    const fm = parseFrontmatter(content);
    expect(fm.active).toBe(true);
    expect(fm.archived).toBe(false);
  });
});

// ── getTitle / getBody ──

describe("getTitle", () => {
  it("extracts the H1 from a markdown body", () => {
    const content = "---\ndate: 2026-06-24\n---\n\n# My Decision\n\nSome text.";
    expect(getTitle(content)).toBe("My Decision");
  });

  it("returns 'Untitled' when no H1 exists", () => {
    const content = "---\ndate: 2026-06-24\n---\n\nJust text.";
    expect(getTitle(content)).toBe("Untitled");
  });
});

describe("getBody", () => {
  it("strips frontmatter and returns body", () => {
    const content = "---\ndate: 2026-06-24\n---\n\n# Title\n\nBody text.";
    expect(getBody(content)).toContain("# Title");
    expect(getBody(content)).not.toContain("date:");
  });
});

// ── formatDecision ──

describe("formatDecision", () => {
  const entry = {
    date: "2026-06-24",
    status: "proposed" as const,
    type: "decision" as const,
    decided_by: "Alice",
    related: ["CONTEXT/sessions/2026-06-23-review.md"],
    body: {
      context: "We need to choose a language.",
      decision: "Use TypeScript for all new projects.",
      rationale: "Type safety and ecosystem.",
      alternatives: "Python, Go, Rust",
    },
  };

  it("produces valid frontmatter", () => {
    const result = formatDecision(entry, "use-typescript", "2026-06-24");
    expect(result).toContain("---");
    expect(result).toContain("date: 2026-06-24");
    expect(result).toContain("status: proposed");
    expect(result).toContain("type: decision");
    expect(result).toContain("decided_by: Alice");
  });

  it("includes body sections", () => {
    const result = formatDecision(entry, "use-typescript", "2026-06-24");
    expect(result).toContain("## Context");
    expect(result).toContain("## Rationale");
    expect(result).toContain("## Alternatives Considered");
    expect(result).toContain("We need to choose a language.");
  });

  it("includes related paths", () => {
    const result = formatDecision(entry, "use-typescript", "2026-06-24");
    expect(result).toContain("CONTEXT/sessions/2026-06-23-review.md");
  });

  it("handles empty related list", () => {
    const noRel = { ...entry, related: [] };
    const result = formatDecision(noRel, "no-rel", "2026-06-24");
    expect(result).toContain("related: []");
  });
});

// ── formatSession ──

describe("formatSession", () => {
  it("includes summary, decisions, and open questions", () => {
    const result = formatSession(
      {
        date: "2026-06-24",
        type: "session",
        summary: "Architecture review",
        decisions: ["CONTEXT/decisions/2026-06-24-use-typescript.md"],
        open_questions: "Should we adopt monorepo?",
        related: [],
      },
      "architecture-review",
      "2026-06-24",
    );
    expect(result).toContain("date: 2026-06-24");
    expect(result).toContain("type: session");
    expect(result).toContain("Architecture review");
    expect(result).toContain("CONTEXT/decisions/2026-06-24-use-typescript.md");
    expect(result).toContain("Should we adopt monorepo?");
  });
});

// ── formatEvent ──

describe("formatEvent", () => {
  it("produces frontmatter with date, type, description", () => {
    const result = formatEvent(
      { date: "2026-06-24", type: "milestone", description: "First release" },
      "first-release",
      "2026-06-24",
    );
    expect(result).toContain("---");
    expect(result).toContain("date: 2026-06-24");
    expect(result).toContain("type: milestone");
    expect(result).toContain("description: First release");
  });

  it("includes related paths in frontmatter", () => {
    const result = formatEvent(
      { date: "2026-06-24", type: "release", description: "v2.0", related: ["CONTEXT/decisions/2026-06-24-use-typescript.md"] },
      "v20",
      "2026-06-24",
    );
    expect(result).toContain("CONTEXT/decisions/2026-06-24-use-typescript.md");
  });

  it("sets related: [] when no related entries", () => {
    const result = formatEvent(
      { date: "2026-06-24", type: "meeting", description: "Sprint review" },
      "sprint-review",
      "2026-06-24",
    );
    expect(result).toContain("related: []");
  });
});
