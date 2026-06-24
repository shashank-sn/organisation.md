export const DEFAULT_SECTIONS = [
  "Identity",
  "Mission & Vision",
  "Team",
  "Active Projects",
  "Decisions",
  "Preferences",
  "Routines",
  "Glossary",
] as const;

export type SectionName = typeof DEFAULT_SECTIONS[number];
