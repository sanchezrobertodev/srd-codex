// Codex links (DAG-76): a bare hash token per chapter and entry, such as #bestiary.goblin,
// #spells.fireball, #armory.longsword, #classes.wizard or #races.dwarf (DAG-84). A chapter's filters (DAG-77) sit between the two as
// "~key-value" segments: #bestiary~cr-1_4-4~type-undead.zombie. Bare tokens work in both hosts, in the single-file build
// and in an Artifact. Kept free of the SRD data so the game can recognise a Codex link without
// loading the Codex (import "@dnd/codex/route").

export type CodexChapter = "bestiary" | "spells" | "armory" | "classes" | "races";

export const CODEX_CHAPTERS: readonly { id: CodexChapter; name: string; noun: string }[] = [
  { id: "bestiary", name: "Bestiary", noun: "creatures" },
  { id: "spells", name: "Spellbook", noun: "spells" },
  { id: "armory", name: "Armory", noun: "items" },
  { id: "classes", name: "Classes", noun: "classes" },
  { id: "races", name: "Races", noun: "races" },
];

export interface CodexRoute {
  chapter: CodexChapter;
  /** The open entry's id, or null for the chapter itself. */
  id: string | null;
  /** The chapter's filters as written in the link ("" for none), e.g. "~cr-1_4-4~type-undead". */
  filters: string;
}

const HASH = /^#?(bestiary|spells|armory|classes|races)((?:~[a-z0-9_-]+)*)(?:\.([a-z0-9][a-z0-9-]*))?$/;

/** The Codex route a location hash names, or null when it isn't a Codex link. */
export function parseCodexHash(hash: string): CodexRoute | null {
  const m = HASH.exec(hash);
  return m ? { chapter: m[1] as CodexChapter, id: m[3] ?? null, filters: m[2] ?? "" } : null;
}

/** The link to a chapter or an entry, with the chapter's filters if given. */
export function codexHref(chapter: CodexChapter, id?: string | null, filters = ""): string {
  return `#${chapter}${filters}${id ? `.${id}` : ""}`;
}

/** The entry a chapter's browser shows for a route: its own entry, or none when another chapter is open. */
export function chapterSelection(chapter: CodexChapter, route: CodexRoute | null): string | null {
  return route && route.chapter === chapter ? route.id : null;
}
