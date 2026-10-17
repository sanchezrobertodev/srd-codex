// The Codex's entries as one index (DAG-76): names, the short facts shown beside them, search across
// every chapter, and the links inside rules text.
import type { ClassData, ItemData, MagicItemData, MonsterData, RaceData, SpellData } from "@dnd/shared";
import { CONDITIONS, DAMAGE_TYPES, RARITIES } from "@dnd/shared";
import { CLASS_GUIDE, CLASSES, ITEMS, MAGIC_ITEMS, MONSTERS, RACES, SPELLS } from "@dnd/data";
import { CODEX_CHAPTERS, type CodexChapter } from "./route";

export const monsterById = new Map(MONSTERS.map((m) => [m.id, m]));
export const spellById = new Map(SPELLS.map((s) => [s.id, s]));
export const classById = new Map(CLASSES.map((c) => [c.id, c]));
/** The races, listed by the race's own name ("Dwarf"); the game's name for them is the subrace's ("Hill Dwarf"). */
export const RACE_ENTRIES: readonly RaceData[] = RACES.map((r) => (r.subrace ? { ...r, name: r.subrace.baseName } : r));
export const raceById = new Map(RACE_ENTRIES.map((r) => [r.id, r]));

/** Everything in the Armory: the game's equipment and the SRD magic items (DAG-83). */
export type ArmoryItem = ItemData | MagicItemData;
export const ARMORY_ITEMS: readonly ArmoryItem[] = [...ITEMS, ...MAGIC_ITEMS];
export const itemById = new Map<string, ArmoryItem>(ARMORY_ITEMS.map((i) => [i.id, i]));

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const crLabel = (cr: number) => (cr === 0.125 ? "1/8" : cr === 0.25 ? "1/4" : cr === 0.5 ? "1/2" : String(cr));
export const ordinal = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);
export const costLabel = (gp: number) => (gp >= 1 ? `${gp} gp` : gp >= 0.1 ? `${Math.round(gp * 10)} sp` : `${Math.round(gp * 100)} cp`);
export const spellKind = (s: SpellData) => (s.level === 0 ? `${cap(s.school)} cantrip` : `${ordinal(s.level)}-level ${s.school}`);
export const rarityLabel = (i: MagicItemData) => (i.rarity === "varies" ? "rarity varies" : i.rarity);
/** A magic item's rarity as a number for sorting: its own, or its lowest form's. Equipment is -1. */
export const rarityRank = (i: ArmoryItem) => (i.kind !== "magic" ? -1 : RARITIES.indexOf(i.rarity === "varies" ? (i.rarities?.[0] ?? "common") : i.rarity));
export const itemKind = (i: ArmoryItem) =>
  i.kind === "magic"
    ? `${cap(i.type)}, ${rarityLabel(i)}`
    : i.kind === "weapon"
      ? `${cap(i.category)} ${i.rangeType} weapon`
      : i.kind === "armor"
        ? i.category === "shield"
          ? "Shield"
          : `${cap(i.category)} armor`
        : "Adventuring gear";

/** The entry, if the chapter has one with this id. */
export type CodexEntry = MonsterData | SpellData | ArmoryItem | ClassData | RaceData;
export function entry(chapter: CodexChapter, id: string): CodexEntry | undefined {
  switch (chapter) {
    case "bestiary":
      return monsterById.get(id);
    case "spells":
      return spellById.get(id);
    case "armory":
      return itemById.get(id);
    case "classes":
      return classById.get(id);
    case "races":
      return raceById.get(id);
  }
}

export const chapterName = (chapter: CodexChapter) => CODEX_CHAPTERS.find((c) => c.id === chapter)!.name;

/** The short line shown beside an entry in search results and lists. */
export function entryFacts(chapter: CodexChapter, id: string): string {
  if (chapter === "bestiary") {
    const m = monsterById.get(id)!;
    return `CR ${crLabel(m.cr)} · ${cap(m.size)} ${m.type}`;
  }
  if (chapter === "spells") return spellKind(spellById.get(id)!);
  if (chapter === "classes") {
    const c = classById.get(id)!;
    return `d${c.hitDie} · ${CLASS_GUIDE[c.id]?.role ?? "class"}`;
  }
  if (chapter === "races") {
    const r = raceById.get(id)!;
    return `${cap(r.size)} · ${r.speed} ft.`;
  }
  const i = itemById.get(id)!;
  return i.kind === "magic" ? itemKind(i) : `${itemKind(i)} · ${costLabel(i.costGp)}`;
}

/* ---------- Search across every chapter ---------- */

export interface Hit {
  chapter: CodexChapter;
  id: string;
  name: string;
  facts: string;
}

const SOURCES: [CodexChapter, readonly { id: string; name: string }[]][] = [["bestiary", MONSTERS], ["spells", SPELLS], ["armory", ARMORY_ITEMS], ["classes", CLASSES], ["races", RACE_ENTRIES]];

/** How well a name matches: 0 the whole name, 1 its start, 2 the start of a word, 3 anywhere, -1 not at all. */
export function matchScore(name: string, query: string): number {
  const n = name.toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return -1;
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.split(/[\s,(/-]+/).some((w) => w.startsWith(q))) return 2;
  return n.includes(q) ? 3 : -1;
}

/**
 * Search by name across the Bestiary, Spellbook and Armory: hits grouped by chapter, each group
 * best match first, and the group with the best match first.
 */
export function searchCodex(query: string, perChapter = 8): { chapter: CodexChapter; hits: Hit[] }[] {
  return SOURCES.map(([chapter, list]) => {
    const scored = list
      .map((e) => ({ e, s: matchScore(e.name, query) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => a.s - b.s || a.e.name.length - b.e.name.length || a.e.name.localeCompare(b.e.name));
    return { chapter, best: scored[0]?.s ?? 9, hits: scored.slice(0, perChapter).map(({ e }) => ({ chapter, id: e.id, name: e.name, facts: entryFacts(chapter, e.id) })) };
  })
    .filter((g) => g.hits.length)
    .sort((a, b) => a.best - b.best)
    .map(({ chapter, hits }) => ({ chapter, hits }));
}

/* ---------- Links inside rules text ---------- */

export type RulesRun =
  | string
  | { kind: "spell"; id: string; text: string }
  | { kind: "condition"; id: string; text: string }
  | { kind: "damage"; id: string; text: string };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const spellPattern = new RegExp(`\\b(${[...SPELLS].sort((a, b) => b.name.length - a.name.length).map((s) => escape(s.name)).join("|")})\\b`, "gi");
const spellByLower = new Map(SPELLS.map((s) => [s.name.toLowerCase(), s.id]));
const conditionPattern = new RegExp(`\\b(${CONDITIONS.join("|")})\\b`, "gi");
// A damage type only where it names damage ("fire damage"), so "a cold stare" stays plain.
const damagePattern = new RegExp(`\\b(${DAMAGE_TYPES.join("|")})(?= damage\\b)`, "gi");

/**
 * Splits rules text into plain runs and links: conditions and damage types everywhere (to a short
 * reminder), and spell names where `spells` is set. Spells are linked only in spellcasting text,
 * where a name is a spell; elsewhere "light" or "shield" is just a word.
 */
export function linkRules(text: string, opts: { spells?: boolean } = {}): RulesRun[] {
  const found: { at: number; end: number; run: Exclude<RulesRun, string> }[] = [];
  const scan = (pattern: RegExp, make: (m: string) => Exclude<RulesRun, string> | null) => {
    for (const m of text.matchAll(pattern)) {
      const run = make(m[0]);
      if (run) found.push({ at: m.index!, end: m.index! + m[0].length, run });
    }
  };
  if (opts.spells) scan(spellPattern, (m) => {
    const id = spellByLower.get(m.toLowerCase());
    return id ? { kind: "spell", id, text: m } : null;
  });
  scan(conditionPattern, (m) => ({ kind: "condition", id: m.toLowerCase(), text: m }));
  scan(damagePattern, (m) => ({ kind: "damage", id: m.toLowerCase(), text: m }));
  found.sort((a, b) => a.at - b.at || b.end - a.end);
  const out: RulesRun[] = [];
  let last = 0;
  for (const f of found) {
    if (f.at < last) continue; // overlaps an earlier, longer link
    if (f.at > last) out.push(text.slice(last, f.at));
    out.push(f.run);
    last = f.end;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Whether a trait or action is a creature's spellcasting, whose text names spells. */
export const isSpellcasting = (name: string) => /spellcasting/i.test(name);

// Item names as the SRD lists them ("Crossbow, light"), and as stat blocks say them ("Light Crossbow").
const itemByLower = new Map(
  ITEMS.flatMap((i) => {
    const name = i.name.toLowerCase();
    const m = /^([^,(]+), ([a-z']+)$/.exec(name);
    return m ? [[name, i.id] as const, [`${m[2]} ${m[1]}`, i.id] as const] : [[name, i.id] as const];
  }),
);
/** The Armory item a monster's action is named after ("Longsword", "Light Crossbow"), if any. */
export function itemForAction(actionName: string): string | undefined {
  return itemByLower.get(actionName.toLowerCase());
}
