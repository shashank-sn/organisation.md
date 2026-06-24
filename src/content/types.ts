export interface Section {
  heading: string;
  content: string;
  startLine: number;
  endLine: number;
}

export interface ParsedDocument {
  sections: Section[];
  raw: string;
  frontmatter: string | null;
}
