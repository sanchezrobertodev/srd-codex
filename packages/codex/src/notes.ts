// What the entry pages say beyond the data itself (DAG-78): stat block wording, rules text split into
// paragraphs and spell lists, and the notes beside each page (similar entries, who casts a spell,
// who carries an item). Pure functions over the bundled data, so they're easy to test.
import type { ItemData, MonsterData, SpellData } from "@dnd/shared";
import { MAGIC_ITEMS, MONSTERS, SPELLS, ITEMS } from "@dnd/data";
import { isSpellcasting, itemForAction, linkRules, monsterById, rarityRank, type ArmoryItem } from "./entries";
import type { CodexChapter } from "./route";

/** A creature's proficiency bonus, from its challenge rating. */
export const proficiencyBonus = (cr: number) => 2 + Math.floor(Math.max(0, Math.ceil(cr) - 1) / 4);

export const speedLabel = (speed: MonsterData["speed"]) =>
  Object.entries(speed)
    .map(([k, v]) => `${k === "walk" ? "" : `${k} `}${v} ft.`)
    .join(", ");

/** Senses as a stat block prints them: "darkvision 60 ft., passive Perception 10". */
export const sensesLabel = (senses: MonsterData["senses"]) =>
  Object.entries(senses)
    .map(([k, v]) => (k === "passive_perception" ? `passive Perception ${v}` : `${k.replace(/_/g, " ")} ${typeof v === "number" ? `${v} ft.` : v}`))
    .join(", ");

/* ---------- Rules text in paragraphs and lists ---------- */

export type RulesBlock =
  | { kind: "p"; text: string; lead?: string }
  | { kind: "list"; items: { label?: string; text: string }[] }
  | { kind: "table"; caption?: string; head: string[]; rows: string[][] };

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

// A line of a spellcasting list: "1st level (4 slots): …", "At will: …", "3/day each: …".
const SPELL_LINE = /^(cantrips?\b[^:]*|at will|\d+\/day(?: each)?|\d+(?:st|nd|rd|th) level[^:]*):\s*(.*)$/i;

// A paragraph that opens with a bold italic name: "***Flee.*** The target spends its turn…".
const LEAD = /^\*\*\*(.+?)\*\*\*\s*(.*)$/;

/**
 * Splits rules text at its line breaks: "- " lines become a list, and in spellcasting text each
 * level's line becomes a list item with its label ("1st level (4 slots)") apart from its spells.
 * A paragraph's "***Name.***" opening becomes its `lead`. A "* " line stays a paragraph: it's the
 * footnote to starred spells ("mage armor*"), not a bullet.
 */
export function rulesBlocks(text: string, spellcasting = false): RulesBlock[] {
  const out: RulesBlock[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    // A table, as the SRD data writes them: "| a | b |" rows, a "|---|---|" rule under the head,
    // and often a "Name (table)" line just before, which becomes its caption.
    if (line.startsWith("|")) {
      if (/^\|[\s:|-]+\|?$/.test(line)) continue;
      const last = out.at(-1);
      if (last?.kind === "table") last.rows.push(cells(line));
      else {
        const caption = last?.kind === "p" && !last.lead && /\(table\)$/i.test(last.text) ? out.pop() : undefined;
        out.push({ kind: "table", ...(caption?.kind === "p" ? { caption: caption.text.replace(/\s*\(table\)$/i, "") } : {}), head: cells(line), rows: [] });
      }
      continue;
    }
    const bullet = /^[-•]\s+/.exec(line);
    const body = bullet ? line.slice(bullet[0].length) : line;
    const level = spellcasting ? SPELL_LINE.exec(body) : null;
    if (!bullet && !level) {
      const lead = LEAD.exec(line);
      out.push(lead ? { kind: "p", lead: lead[1]!, text: lead[2]! } : { kind: "p", text: line });
      continue;
    }
    const item = level ? { label: level[1]!, text: level[2]! } : { text: body };
    const last = out.at(-1);
    if (last?.kind === "list") last.items.push(item);
    else out.push({ kind: "list", items: [item] });
  }
  return out;
}

/* ---------- Notes beside a page ---------- */

/** Creatures of the same type, nearest in challenge first. */
export function similarMonsters(m: MonsterData, n = 5): MonsterData[] {
  return MONSTERS.filter((x) => x.type === m.type && x.id !== m.id)
    .sort((a, b) => Math.abs(a.cr - m.cr) - Math.abs(b.cr - m.cr) || a.cr - b.cr || a.name.localeCompare(b.name))
    .slice(0, n);
}

let casters: Map<string, string[]> | undefined;
/** The creatures whose spellcasting names this spell, by name. */
export function castersOf(spellId: string): MonsterData[] {
  if (!casters) {
    casters = new Map();
    for (const m of MONSTERS) {
      for (const t of [...m.traits, ...m.actions]) {
        if (!isSpellcasting(t.name)) continue;
        for (const r of linkRules(t.description, { spells: true })) {
          if (typeof r === "string" || r.kind !== "spell") continue;
          const list = casters.get(r.id) ?? [];
          if (!list.includes(m.id)) list.push(m.id);
          casters.set(r.id, list);
        }
      }
    }
  }
  return (casters.get(spellId) ?? []).map((id) => monsterById.get(id)!).sort((a, b) => a.cr - b.cr || a.name.localeCompare(b.name));
}

/** Spells of the same level and school. */
export function relatedSpells(s: SpellData, n = 6): SpellData[] {
  return SPELLS.filter((x) => x.level === s.level && x.school === s.school && x.id !== s.id)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, n);
}

let wielders: Map<string, string[]> | undefined;
/** The creatures with an attack named after this item ("Shortsword", "Light Crossbow"). */
export function wieldersOf(itemId: string): MonsterData[] {
  if (!wielders) {
    wielders = new Map();
    for (const m of MONSTERS) {
      for (const a of m.actions) {
        const id = itemForAction(a.name);
        if (!id) continue;
        const list = wielders.get(id) ?? [];
        if (!list.includes(m.id)) list.push(m.id);
        wielders.set(id, list);
      }
    }
  }
  return (wielders.get(itemId) ?? []).map((id) => monsterById.get(id)!).sort((a, b) => a.cr - b.cr || a.name.localeCompare(b.name));
}

const categoryOf = (i: ItemData) => (i.kind === "gear" ? "" : i.category);
/** Items of the same kind and category, nearest in cost first; magic items of the same type, nearest in rarity. */
export function similarItems(i: ArmoryItem, n = 5): ArmoryItem[] {
  if (i.kind === "magic") {
    return MAGIC_ITEMS.filter((x) => x.type === i.type && x.id !== i.id)
      .sort((a, b) => Math.abs(rarityRank(a) - rarityRank(i)) - Math.abs(rarityRank(b) - rarityRank(i)) || a.name.localeCompare(b.name))
      .slice(0, n);
  }
  return ITEMS.filter((x) => x.kind === i.kind && categoryOf(x) === categoryOf(i) && x.id !== i.id)
    .sort((a, b) => Math.abs(a.costGp - i.costGp) - Math.abs(b.costGp - i.costGp) || a.name.localeCompare(b.name))
    .slice(0, n);
}

/* ---------- Landing ---------- */

/** "Good places to start": what each chapter shows before an entry is opened. */
export const FEATURED: Record<CodexChapter, readonly string[]> = {
  bestiary: ["goblin", "wolf", "skeleton", "owlbear", "mimic", "bandit-captain", "young-green-dragon", "lich"],
  spells: ["fire-bolt", "magic-missile", "cure-wounds", "shield", "misty-step", "fireball", "counterspell", "wish"],
  armory: ["longsword", "dagger", "shortbow", "chain-mail", "shield", "potion-of-healing", "thieves-tools", "rope-hempen-50-feet"],
  classes: ["fighter", "rogue", "barbarian", "cleric", "wizard", "ranger"],
  races: ["human", "dwarf", "halfling", "elf", "half-orc", "gnome"],
};

/** The art slot's stand-in until the art lands (DAG-71 to DAG-73): the name's initials. */
export const monogram = (name: string) =>
  name
    .split(/[\s,()-]+/)
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("") || name.charAt(0).toUpperCase();
