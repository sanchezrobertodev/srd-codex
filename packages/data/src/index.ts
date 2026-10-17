import type { ClassData, ItemData, MagicItemData, MonsterData, RaceData, SpellData } from "@dnd/shared";
import classesJson from "./generated/classes.json";
import racesJson from "./generated/races.json";
import spellsJson from "./generated/spells.json";
import monstersJson from "./generated/monsters.json";
import itemsJson from "./generated/items.json";
import magicItemsJson from "./generated/magic-items.json";
import { FAVORED_ENEMY_TYPES, FAVORED_HUMANOIDS, LANGUAGES } from "./characterOptions";
import { EXPANDED_SPELLS } from "./overrides";
import { parseMonsterAttack } from "./monsterAttack";
import monsterAbilities from "./generated/monster-abilities.json";

export * from "./overrides";
export * from "./backgrounds";
export * from "./characterOptions";
export * from "./creatorGuide";
export * from "./premades";
export * from "./kits";
export * from "./persona";
export * from "./encounters";
export * from "./explorationEvents";
export * from "./rulesGlossary";
export * from "./levelOptions";

const byId = <T extends { id: string }>(arr: T[]) => new Map(arr.map((x) => [x.id, x]));

export const CLASSES = classesJson as ClassData[];
export const RACES = racesJson as RaceData[];
export const SPELLS = spellsJson as SpellData[];
const abilityData = monsterAbilities as Record<string, { usage: Record<string, MonsterData["actions"][number]["usage"]>; spellcasting: NonNullable<MonsterData["spellcasting"]>; blindBeyondBlindsight?: boolean }>;
export const MONSTERS: MonsterData[] = (monstersJson as MonsterData[]).map((m) => {
  if (m.cr > 2) return m;
  const meta = abilityData[m.id];
  return { ...m, ...(meta?.blindBeyondBlindsight ? { blindBeyondBlindsight: true } : {}), ...(meta?.spellcasting.length ? { spellcasting: meta.spellcasting } : {}), traits: m.traits.map((t) => ({ ...t, ...(meta?.usage[t.name] ? { usage: meta.usage[t.name] } : {}) })), actions: m.actions.map((a) => {
    const attack = parseMonsterAttack(a.description);
    const usage = meta?.usage[a.name];
    // A weapon attack whose hit only grapples or restrains (Web, Smother) keeps its roll, with no damage (DAG-119).
    return { ...a, ...(!a.attack && attack ? { attack } : {}), ...(usage ? { usage } : {}) };
  }) };
});
export const ITEMS = itemsJson as ItemData[];
/** SRD 5.1 magic items, for reference (the Codex's Armory, DAG-83). Not part of ITEMS: the engine doesn't use them. */
export const MAGIC_ITEMS = magicItemsJson as MagicItemData[];

const classMap = byId(CLASSES);
const raceMap = byId(RACES);
const spellMap = byId(SPELLS);
const monsterMap = byId(MONSTERS);
const itemMap = byId(ITEMS);

function must<T>(map: Map<string, T>, id: string, kind: string): T {
  const v = map.get(id);
  if (!v) throw new Error(`Unknown ${kind}: ${id}`);
  return v;
}

export const getClass = (id: string) => must(classMap, id, "class");
export const getRace = (id: string) => must(raceMap, id, "race");
export const getSpell = (id: string) => must(spellMap, id, "spell");
export const getMonster = (id: string) => must(monsterMap, id, "monster");
export const getItem = (id: string) => must(itemMap, id, "item");

export const findClass = (id: string) => classMap.get(id);
export const findRace = (id: string) => raceMap.get(id);
export const findSpell = (id: string) => spellMap.get(id);
export const findMonster = (id: string) => monsterMap.get(id);
export const findItem = (id: string) => itemMap.get(id);

/** A class's spells up to a level: those the SRD lists for it, and any its features add (EXPANDED_SPELLS). */
export const spellsForClass = (classId: string, maxLevel = 9) =>
  SPELLS.filter((s) => (s.classes.includes(classId) || EXPANDED_SPELLS[classId]?.includes(s.id)) && s.level <= maxLevel);

export const monstersByCr = (maxCr: number) => MONSTERS.filter((m) => m.cr <= maxCr);

/** Primordial's dialects, which monsters list by name. */
const PRIMORDIAL_DIALECTS = /\b(?:Aquan|Auran|Ignan|Terran)\b/g;

/**
 * The languages a monster speaks, of those a hero can learn. A language it understands but can't
 * speak doesn't count; a Primordial dialect counts as Primordial; "Giant Eagle" isn't Giant.
 */
export function monsterSpeaks(languages: string): string[] {
  const spoken = languages
    .replace(/understands[^;]*?(?:but can't speak[^;,]*|$)/gi, "")
    .replace(/\bGiant (?:Eagle|Elk|Owl)\b/g, "")
    .replace(PRIMORDIAL_DIALECTS, "Primordial");
  return LANGUAGES.filter((l) => new RegExp(`\\b${l}\\b`).test(spoken));
}

const creatureType = (m: MonsterData): string => (/^swarm\b/.test(m.type) ? "beast" : m.type);

/**
 * The languages a ranger's favored enemy speaks (SRD 5.1 Favored Enemy): those of the SRD monsters
 * of that creature type, or of that humanoid race and its people.
 */
export function favoredEnemySpeaks(id: string): string[] {
  const humanoid = FAVORED_HUMANOIDS[id];
  const monsters = humanoid ? MONSTERS.filter((m) => humanoid.monsters.includes(m.id)) : FAVORED_ENEMY_TYPES[id] ? MONSTERS.filter((m) => creatureType(m) === id) : [];
  const spoken = new Set([...(humanoid?.languages ?? []), ...monsters.flatMap((m) => monsterSpeaks(m.languages))]);
  return LANGUAGES.filter((l) => spoken.has(l));
}

/**
 * The first level at which a class casts spells (a cantrip or a spell slot), or null if it never
 * does. The Paladin (DAG-62) and the Ranger have spellcasting data but cast nothing until level 2.
 */
export function firstCastingLevel(cls: ClassData): number | null {
  const sc = cls.spellcasting;
  if (!sc) return null;
  for (let level = 1; level <= 20; level++) {
    if ((sc.cantripsKnown[level] ?? 0) > 0 || Object.values(sc.slots[level] ?? {}).some((n) => n > 0)) return level;
  }
  return null;
}

/** How many spells a caster who knows its spells (DAG-57) knows at a class level; 0 for any other class. */
export const spellsKnownAt = (cls: ClassData, level: number): number => cls.spellcasting?.spellsKnown?.[level] ?? 0;

/** The class's spellcasting if it casts at level 1, else null: what the creator and a new hero go by. */
export const levelOneCasting = (cls: ClassData): ClassData["spellcasting"] | null => (firstCastingLevel(cls) === 1 ? cls.spellcasting! : null);
export * from "./portraits";
