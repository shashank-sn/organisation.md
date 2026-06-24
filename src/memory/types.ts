export type DecisionStatus = "proposed" | "accepted" | "superseded";

export interface DecisionEntry {
  date: string; // YYYY-MM-DD
  status: DecisionStatus;
  type: "decision";
  decided_by: string;
  related: string[]; // paths to related entries
  body: {
    context: string;
    decision: string;
    rationale: string;
    alternatives: string;
  };
}

export interface SessionEntry {
  date: string;
  type: "session";
  summary: string;
  decisions: string[]; // paths to decisions made
  open_questions: string;
  related: string[];
}

export interface EventEntry {
  date: string;
  type: string; // event type tag
  description: string;
  related?: string[];
}

export type MemoryEntry = DecisionEntry | SessionEntry | EventEntry;

export interface SearchResult {
  file: string;
  title: string;
  snippet: string;
  type: "decision" | "session" | "event" | "org" | "context";
  status?: string;
  date?: string;
}

export interface GraphEntry {
  path: string;
  title: string;
  type: "decision" | "session" | "event";
  related: string[];
  date: string;
  status?: string;
}

export interface RelatedEntry {
  path: string;
  title: string;
  type: "decision" | "session" | "event";
  direction: "inbound" | "outbound";
  date?: string;
  status?: string;
}
