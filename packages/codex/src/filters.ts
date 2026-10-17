// Lists and filters for each chapter (DAG-77): what can be filtered and sorted, how a choice is
// written into the chapter's link so a filtered view can be shared, and how the list is built.
import type { ClassData, MagicItemData, MonsterData, RaceData, SpellData } from "@dnd/shared";
import { DAMAGE_TYPES, RARITIES } from "@dnd/shared";
import { BIOME_ENCOUNTERS, CLASS_GUIDE, CLASSES, COMPLEXITY_LABELS, ITEMS, MONSTERS, RACE_ABILITY_CHOICES, RACE_GUIDE, SITE_ENCOUNTERS, SPELLS, type Complexity } from "@dnd/data";
import { ARMORY_ITEMS, cap, RACE_ENTRIES, costLabel, crLabel, ordinal, rarityLabel, rarityRank, type ArmoryItem } from "./entries";
import type { CodexChapter } from "./route";


export interface Option {
  value: string;
  label: string;
}

/** One filter: its options, combined with OR inside the filter and AND across filters. */
export interface FilterDef<T> {
  key: string;
  label: string;
  options: readonly Option[];
  test: (entry: T, value: string) => boolean;
  /** Shown as chips above the list; the rest sit under "More filters". */
  quick?: boolean;
}

export interface SortDef<T> {
  value: string;
  label: string;
  compare: (a: T, b: T) => number;
  /** The heading an entry is listed under, for sorts that group. */
  group?: (entry: T) => string;
}

export interface ChapterSpec<T extends { id: string; name: string }> {
  chapter: CodexChapter;
  items: readonly T[];
  filters: readonly FilterDef<T>[];
  sorts: readonly SortDef<T>[];
  /** The Bestiary's challenge range. */
  cr?: { values: readonly number[]; of: (entry: T) => number; bands: readonly { label: string; min: number; max: number }[] };
}

export interface FilterState {
  /** Text the name must contain. */
  q: string;
  /** Chosen option values, by filter key. */
  picks: Readonly<Record<string, readonly string[]>>;
  /** Challenge range, inclusive, or null for any. */
  cr: readonly [number, number] | null;
  sort: string;
}

/** What reading and writing a chapter's filters needs from its spec (not the tests, so any chapter fits). */
export interface SpecShape {
  filters: readonly { key: string; options: readonly Option[] }[];
  sorts: readonly { value: string }[];
  cr?: { values: readonly number[] } | undefined;
}

export const emptyFilters = (spec: SpecShape): FilterState => ({ q: "", picks: {}, cr: null, sort: spec.sorts[0]!.value });

/* ---------- Links: "~key-value-value" segments, only letters, digits, "_" and "-" ---------- */

/** A value as it appears in a link: lower case, anything but letters and digits as "_". */
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const crSlug = (cr: number) => slug(crLabel(cr));

/** The filter part of a chapter's link ("" when nothing is chosen), e.g. "~cr-1_4-4~type-undead~sort-name". */
export function encodeFilters(spec: SpecShape, state: FilterState): string {
  const parts: string[] = [];
  const q = slug(state.q);
  if (q) parts.push(`q-${q}`);
  if (state.cr) parts.push(`cr-${crSlug(state.cr[0])}-${crSlug(state.cr[1])}`);
  for (const def of spec.filters) {
    const picked = state.picks[def.key];
    if (picked?.length) parts.push(`${def.key}-${picked.map(slug).join("-")}`);
  }
  if (state.sort !== spec.sorts[0]!.value) parts.push(`sort-${state.sort}`);
  return parts.map((p) => `~${p}`).join("");
}

/** The filters a link's filter part names; anything it doesn't recognise is ignored. */
export function decodeFilters(spec: SpecShape, text: string): FilterState {
  const state: { q: string; picks: Record<string, string[]>; cr: [number, number] | null; sort: string } = { q: "", picks: {}, cr: null, sort: spec.sorts[0]!.value };
  for (const part of text.split("~").filter(Boolean)) {
    const [key, ...values] = part.split("-");
    if (key === "q") state.q = values.join(" ").replace(/_/g, " ");
    else if (key === "cr" && spec.cr && values.length === 2) {
      const lo = spec.cr.values.find((v) => crSlug(v) === values[0]);
      const hi = spec.cr.values.find((v) => crSlug(v) === values[1]);
      if (lo !== undefined && hi !== undefined) state.cr = lo <= hi ? [lo, hi] : [hi, lo];
    } else if (key === "sort") {
      if (spec.sorts.some((s) => s.value === values[0])) state.sort = values[0]!;
    } else {
      const def = spec.filters.find((d) => d.key === key);
      if (!def) continue;
      const picked = values.map((v) => def.options.find((o) => slug(o.value) === v)?.value).filter((v): v is string => !!v);
      if (picked.length) state.picks[def.key] = picked;
    }
  }
  return state;
}

/* ---------- Building the list ---------- */

/**
 * A name or name filter as words: lower case, punctuation as spaces. The link keeps a name filter
 * as such words ("Half-Orc" is written half_orc and read back as "half orc"), so names are compared
 * the same way and the filter still matches after a reload.
 */
const nameWords = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function applyFilters<T extends { id: string; name: string }>(spec: ChapterSpec<T>, state: FilterState): T[] {
  const q = nameWords(state.q);
  const sort = spec.sorts.find((s) => s.value === state.sort) ?? spec.sorts[0]!;
  return spec.items
    .filter(
      (e) =>
        (!q || nameWords(e.name).includes(q)) &&
        (!state.cr || !spec.cr || (spec.cr.of(e) >= state.cr[0] && spec.cr.of(e) <= state.cr[1])) &&
        spec.filters.every((def) => {
          const picked = state.picks[def.key];
          return !picked?.length || picked.some((v) => def.test(e, v));
        }),
    )
    .sort((a, b) => sort.compare(a, b) || a.name.localeCompare(b.name));
}

export function groupOf<T extends { id: string; name: string }>(spec: ChapterSpec<T>, state: FilterState): ((entry: T) => string) | undefined {
  return (spec.sorts.find((s) => s.value === state.sort) ?? spec.sorts[0]!).group;
}

/** How many filters are chosen (each challenge range, option and name text counts once). */
export function activeCount(state: FilterState): number {
  return (state.q.trim() ? 1 : 0) + (state.cr ? 1 : 0) + Object.values(state.picks).reduce((n, v) => n + v.length, 0);
}

export const toggle = (list: readonly string[] | undefined, v: string): string[] => (list?.includes(v) ? list.filter((x) => x !== v) : [...(list ?? []), v]);

/* ---------- The Bestiary ---------- */

const BIOME_LABELS: Record<string, string> = {
  water: "Coasts and lakes", ice: "Ice fields", taiga: "Taiga", tundra: "Tundra", "temperate-forest": "Temperate forest",
  woodland: "Woodland", steppe: "Steppe", jungle: "Jungle", savanna: "Savanna", desert: "Desert",
};
const SITE_LABELS: Record<string, string> = { dungeon: "Dungeons", ruin: "Ruins", lair: "Lairs", cave: "Caves", shrine: "Shrines", landmark: "Landmarks", settlement: "Settlements" };

/** Where each creature turns up in the game's encounter tables (DAG-33): biomes and kinds of site. */
export const HABITATS: ReadonlyMap<string, readonly string[]> = (() => {
  const out = new Map<string, string[]>();
  const add = (table: Record<string, readonly { monsterId: string; with?: readonly { monsterId: string }[] }[]>) => {
    for (const [place, list] of Object.entries(table)) {
      for (const e of list) for (const id of [e.monsterId, ...(e.with ?? []).map((w) => w.monsterId)]) {
        const homes = out.get(id) ?? [];
        if (!homes.includes(place)) homes.push(place);
        out.set(id, homes);
      }
    }
  };
  add(BIOME_ENCOUNTERS);
  add(SITE_ENCOUNTERS);
  return out;
})();
export const habitatLabel = (key: string) => BIOME_LABELS[key] ?? SITE_LABELS[key] ?? cap(key);

const ALIGNMENTS: Option[] = [
  { value: "lawful", label: "Lawful" },
  { value: "chaotic", label: "Chaotic" },
  { value: "good", label: "Good" },
  { value: "evil", label: "Evil" },
  { value: "neutral", label: "Neutral" },
  { value: "unaligned", label: "Unaligned" },
  { value: "any", label: "Any alignment" },
];
/** Whether an alignment line ("chaotic evil", "any non-good alignment") fits one of the choices above. */
export function alignmentFits(alignment: string, value: string): boolean {
  const a = alignment.toLowerCase();
  if (value === "any") return a.startsWith("any");
  if (value === "unaligned") return a === "unaligned";
  return new RegExp(`(^|\\s)${value}\\b`).test(a) && !a.includes(`non-${value}`);
}

const SIZES = ["tiny", "small", "medium", "large", "huge", "gargantuan"];
const CR_VALUES = [...new Set(MONSTERS.map((m) => m.cr))].sort((a, b) => a - b);

export const BESTIARY: ChapterSpec<MonsterData> = {
  chapter: "bestiary",
  items: MONSTERS,
  cr: {
    values: CR_VALUES,
    of: (m) => m.cr,
    bands: [
      { label: "0–¼", min: 0, max: 0.25 },
      { label: "½–1", min: 0.5, max: 1 },
      { label: "2–4", min: 2, max: 4 },
      { label: "5–10", min: 5, max: 10 },
      { label: "11–16", min: 11, max: 16 },
      { label: "17+", min: 17, max: 30 },
    ],
  },
  filters: [
    { key: "type", label: "Type", options: [...new Set(MONSTERS.map((m) => m.type))].sort().map((t) => ({ value: t, label: cap(t) })), test: (m, v) => m.type === v },
    { key: "size", label: "Size", options: SIZES.map((s) => ({ value: s, label: cap(s) })), test: (m, v) => m.size === v },
    { key: "align", label: "Alignment", options: ALIGNMENTS, test: (m, v) => alignmentFits(m.alignment, v) },
    {
      key: "home",
      label: "Where it lives",
      options: [...Object.keys(BIOME_ENCOUNTERS), ...Object.keys(SITE_ENCOUNTERS)].filter((k) => [...HABITATS.values()].some((h) => h.includes(k))).map((k) => ({ value: k, label: habitatLabel(k) })),
      test: (m, v) => HABITATS.get(m.id)?.includes(v) ?? false,
    },
  ],
  sorts: [
    { value: "cr", label: "Challenge", compare: (a, b) => a.cr - b.cr, group: (m) => `Challenge ${crLabel(m.cr)}` },
    { value: "name", label: "Name", compare: (a, b) => a.name.localeCompare(b.name), group: (m) => m.name[0]!.toUpperCase() },
    { value: "type", label: "Type", compare: (a, b) => a.type.localeCompare(b.type) || a.cr - b.cr, group: (m) => cap(m.type) },
  ],
};

/* ---------- The Spellbook ---------- */

const SAVE_NAMES: Record<string, string> = { strength: "str", dexterity: "dex", constitution: "con", intelligence: "int", wisdom: "wis", charisma: "cha" };

/** The damage types a spell deals: from the engine's effect, or named in its text ("fire damage"). */
export function spellDamageTypes(s: SpellData): string[] {
  const e = s.effect;
  if ((e.type === "attack" || e.type === "save" || e.type === "auto-damage") && e.damageType) return [e.damageType];
  const found = new Set<string>();
  for (const m of s.description.matchAll(new RegExp(`\\b(${DAMAGE_TYPES.join("|")}) damage\\b`, "gi"))) found.add(m[1]!.toLowerCase());
  return [...found];
}

/** The saving throws a spell calls for. */
export function spellSaves(s: SpellData): string[] {
  if (s.effect.type === "save") return [s.effect.save];
  const found = new Set<string>();
  for (const m of s.description.matchAll(/\b(strength|dexterity|constitution|intelligence|wisdom|charisma) saving throw/gi)) found.add(SAVE_NAMES[m[1]!.toLowerCase()]!);
  return [...found];
}

/** "action", "bonus", "reaction" or "longer" (a minute or more). */
export function castingKind(s: SpellData): string {
  const t = s.castingTime.toLowerCase();
  return t.includes("bonus action") ? "bonus" : t.includes("reaction") ? "reaction" : t.includes("action") ? "action" : "longer";
}

export const SPELLBOOK: ChapterSpec<SpellData> = {
  chapter: "spells",
  items: SPELLS,
  filters: [
    {
      key: "lvl",
      label: "Level",
      quick: true,
      options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => ({ value: String(l), label: l === 0 ? "Cantrip" : ordinal(l) })),
      test: (s, v) => s.level === Number(v),
    },
    { key: "school", label: "School", options: [...new Set(SPELLS.map((s) => s.school))].sort().map((s) => ({ value: s, label: cap(s) })), test: (s, v) => s.school === v },
    { key: "class", label: "Class", options: CLASSES.filter((c) => c.spellcasting).map((c) => ({ value: c.id, label: c.name })), test: (s, v) => s.classes.includes(v) },
    {
      key: "cast",
      label: "Casting time",
      options: [
        { value: "action", label: "1 action" },
        { value: "bonus", label: "Bonus action" },
        { value: "reaction", label: "Reaction" },
        { value: "longer", label: "1 minute or longer" },
      ],
      test: (s, v) => castingKind(s) === v,
    },
    { key: "conc", label: "Concentration", options: [{ value: "yes", label: "Concentration" }], test: (s) => s.concentration },
    { key: "rit", label: "Ritual", options: [{ value: "yes", label: "Ritual" }], test: (s) => s.ritual },
    { key: "dmg", label: "Damage type", options: DAMAGE_TYPES.map((d) => ({ value: d, label: cap(d) })), test: (s, v) => spellDamageTypes(s).includes(v) },
    {
      key: "save",
      label: "Saving throw",
      options: ["str", "dex", "con", "int", "wis", "cha"].map((a) => ({ value: a, label: a.toUpperCase() })),
      test: (s, v) => spellSaves(s).includes(v),
    },
  ],
  sorts: [
    { value: "level", label: "Level", compare: (a, b) => a.level - b.level, group: (s) => (s.level === 0 ? "Cantrips" : `${ordinal(s.level)} level`) },
    { value: "name", label: "Name", compare: (a, b) => a.name.localeCompare(b.name), group: (s) => s.name[0]!.toUpperCase() },
    { value: "school", label: "School", compare: (a, b) => a.school.localeCompare(b.school) || a.level - b.level, group: (s) => cap(s.school) },
  ],
};

/* ---------- The Armory ---------- */

const COST_BANDS: { value: string; label: string; min: number; max: number }[] = [
  { value: "under1", label: "Under 1 gp", min: 0, max: 0.99 },
  { value: "1to10", label: "1–10 gp", min: 1, max: 10 },
  { value: "11to50", label: "11–50 gp", min: 10.01, max: 50 },
  { value: "over50", label: "Over 50 gp", min: 50.01, max: Infinity },
];
const WEIGHT_BANDS: { value: string; label: string; min: number; max: number }[] = [
  { value: "light", label: "1 lb. or less", min: 0, max: 1 },
  { value: "2to5", label: "2–5 lb.", min: 1.01, max: 5 },
  { value: "6to20", label: "6–20 lb.", min: 5.01, max: 20 },
  { value: "heavy", label: "Over 20 lb.", min: 20.01, max: Infinity },
];
const KIND_ORDER: Record<string, number> = { weapon: 0, armor: 1, gear: 2, magic: 3 };
const MAGIC_GROUPS: Record<MagicItemData["type"], string> = {
  armor: "Magic armor", weapon: "Magic weapons", potion: "Potions", ring: "Rings", rod: "Rods", scroll: "Scrolls", staff: "Staffs", wand: "Wands", "wondrous item": "Wondrous items",
};
const itemGroup = (i: ArmoryItem) =>
  i.kind === "magic" ? MAGIC_GROUPS[i.type] : i.kind === "weapon" ? `${cap(i.category)} weapons` : i.kind === "armor" ? (i.category === "shield" ? "Shields" : `${cap(i.category)} armor`) : "Adventuring gear";
// Magic items have no price or weight in the SRD: they sort after the equipment.
const costOf = (i: ArmoryItem) => (i.kind === "magic" ? Infinity : i.costGp);
const weightOf = (i: ArmoryItem) => (i.kind === "magic" ? Infinity : i.weight);
const byNumber = (a: number, b: number) => (a === b ? 0 : a < b ? -1 : 1);

export const ARMORY: ChapterSpec<ArmoryItem> = {
  chapter: "armory",
  items: ARMORY_ITEMS,
  filters: [
    {
      key: "kind",
      label: "Kind",
      quick: true,
      options: [
        { value: "weapon", label: "Weapons" },
        { value: "armor", label: "Armor & shields" },
        { value: "gear", label: "Gear" },
        { value: "magic", label: "Magic items" },
      ],
      test: (i, v) => i.kind === v,
    },
    {
      key: "type",
      label: "Magic item type",
      options: (Object.keys(MAGIC_GROUPS) as MagicItemData["type"][]).map((t) => ({ value: t, label: MAGIC_GROUPS[t] })),
      test: (i, v) => i.kind === "magic" && i.type === v,
    },
    {
      key: "rarity",
      label: "Rarity",
      options: RARITIES.map((r) => ({ value: r, label: cap(r) })),
      // An item whose rarity varies matches each of its forms' rarities.
      test: (i, v) => i.kind === "magic" && (i.rarity === v || (i.rarities ?? []).includes(v as (typeof RARITIES)[number])),
    },
    {
      key: "attune",
      label: "Attunement",
      options: [
        { value: "yes", label: "Needs attunement" },
        { value: "no", label: "No attunement" },
      ],
      test: (i, v) => i.kind === "magic" && !!i.attunement === (v === "yes"),
    },
    {
      key: "cat",
      label: "Category",
      options: ["simple", "martial", "light", "medium", "heavy", "shield"].map((c) => ({ value: c, label: c === "shield" ? "Shields" : `${cap(c)} ${c === "simple" || c === "martial" ? "weapons" : "armor"}` })),
      test: (i, v) => (i.kind === "weapon" || i.kind === "armor") && i.category === v,
    },
    {
      key: "range",
      label: "Weapon range",
      options: [
        { value: "melee", label: "Melee" },
        { value: "ranged", label: "Ranged" },
      ],
      test: (i, v) => i.kind === "weapon" && i.rangeType === v,
    },
    {
      key: "prop",
      label: "Weapon property",
      options: [...new Set(ITEMS.flatMap((i) => (i.kind === "weapon" ? i.properties : [])))].sort().map((p) => ({ value: p, label: cap(p) })),
      test: (i, v) => i.kind === "weapon" && (i.properties as readonly string[]).includes(v),
    },
    { key: "cost", label: "Cost", options: COST_BANDS, test: (i, v) => i.kind !== "magic" && inBand(COST_BANDS, v, i.costGp) },
    { key: "wt", label: "Weight", options: WEIGHT_BANDS, test: (i, v) => i.kind !== "magic" && inBand(WEIGHT_BANDS, v, i.weight) },
  ],
  sorts: [
    { value: "kind", label: "Kind", compare: (a, b) => KIND_ORDER[a.kind]! - KIND_ORDER[b.kind]! || itemGroup(a).localeCompare(itemGroup(b)), group: itemGroup },
    { value: "name", label: "Name", compare: (a, b) => a.name.localeCompare(b.name), group: (i) => i.name[0]!.toUpperCase() },
    { value: "cost", label: "Cost", compare: (a, b) => byNumber(costOf(a), costOf(b)) },
    { value: "weight", label: "Weight", compare: (a, b) => byNumber(weightOf(a), weightOf(b)) },
    {
      value: "rarity",
      label: "Rarity",
      compare: (a, b) => rarityRank(a) - rarityRank(b),
      group: (i) => (i.kind === "magic" ? cap(i.rarity === "varies" ? `${i.rarities?.[0] ?? "common"} and up` : i.rarity) : "Equipment"),
    },
  ],
};

function inBand(bands: readonly { value: string; min: number; max: number }[], value: string, n: number): boolean {
  const b = bands.find((x) => x.value === value);
  return !!b && n >= b.min && n <= b.max;
}

/* ---------- Classes and Races (DAG-84) ---------- */

const ABILITY_OPTIONS: Option[] = [
  { value: "str", label: "Strength" },
  { value: "dex", label: "Dexterity" },
  { value: "con", label: "Constitution" },
  { value: "int", label: "Intelligence" },
  { value: "wis", label: "Wisdom" },
  { value: "cha", label: "Charisma" },
];
const COMPLEXITY_OPTIONS: Option[] = (Object.keys(COMPLEXITY_LABELS) as Complexity[]).map((k) => ({ value: k, label: COMPLEXITY_LABELS[k] }));

/** How a class casts: full casters from 1st level, half casters from 2nd, the Warlock's Pact Magic, or none. */
export function castingOf(c: ClassData): "full" | "half" | "pact" | "none" {
  if (!c.spellcasting) return "none";
  if (c.spellcasting.pact) return "pact";
  return (c.spellcasting.slots[1]?.[1] ?? 0) > 0 ? "full" : "half";
}

export const CLASS_SPEC: ChapterSpec<ClassData> = {
  chapter: "classes",
  items: CLASSES,
  filters: [
    {
      key: "cast",
      label: "Spellcasting",
      quick: true,
      options: [
        { value: "full", label: "Full casters" },
        { value: "half", label: "Half casters" },
        { value: "pact", label: "Pact magic" },
        { value: "none", label: "No spells" },
      ],
      test: (c, v) => castingOf(c) === v,
    },
    { key: "pick", label: "For new players", options: COMPLEXITY_OPTIONS, test: (c, v) => CLASS_GUIDE[c.id]?.complexity === v },
    { key: "hd", label: "Hit die", options: [6, 8, 10, 12].map((d) => ({ value: String(d), label: `d${d}` })), test: (c, v) => c.hitDie === Number(v) },
    { key: "prime", label: "Primary ability", options: ABILITY_OPTIONS, test: (c, v) => (c.primaryAbilities as string[]).includes(v) },
  ],
  sorts: [
    { value: "name", label: "Name", compare: (a, b) => a.name.localeCompare(b.name) },
    { value: "hd", label: "Hit die", compare: (a, b) => b.hitDie - a.hitDie || a.name.localeCompare(b.name), group: (c) => `d${c.hitDie}` },
  ],
};

/** The abilities a race raises, its own and its subrace's. */
export const raceAbilities = (r: RaceData): string[] => Object.keys(r.abilityBonuses);
/**
 * How a race can raise an ability: "fixed" by its bonuses, "choice" when it lets the player pick
 * that ability (the Half-Elf's two +1s), or undefined.
 */
export function raceRaises(r: RaceData, ability: string): "fixed" | "choice" | undefined {
  if ((r.abilityBonuses[ability as keyof RaceData["abilityBonuses"]] ?? 0) > 0) return "fixed";
  const choice = RACE_ABILITY_CHOICES[r.id];
  return choice && !choice.exclude.includes(ability) ? "choice" : undefined;
}

export const RACE_SPEC: ChapterSpec<RaceData> = {
  chapter: "races",
  items: RACE_ENTRIES,
  filters: [
    {
      key: "size",
      label: "Size",
      quick: true,
      options: [
        { value: "medium", label: "Medium" },
        { value: "small", label: "Small" },
      ],
      test: (r, v) => r.size === v,
    },
    { key: "pick", label: "For new players", options: COMPLEXITY_OPTIONS, test: (r, v) => RACE_GUIDE[r.id]?.complexity === v },
    {
      key: "dv",
      label: "Darkvision",
      options: [
        { value: "yes", label: "Darkvision" },
        { value: "no", label: "No darkvision" },
      ],
      test: (r, v) => !!r.darkvision === (v === "yes"),
    },
    // A race that lets the player choose (the Half-Elf's two +1s) fits any ability it allows.
    { key: "ability", label: "Raises", options: ABILITY_OPTIONS, test: (r, v) => !!raceRaises(r, v) },
  ],
  sorts: [
    { value: "name", label: "Name", compare: (a, b) => a.name.localeCompare(b.name) },
    { value: "speed", label: "Speed", compare: (a, b) => b.speed - a.speed || a.name.localeCompare(b.name), group: (r) => `${r.speed} ft.` },
  ],
};

export const SPECS = { bestiary: BESTIARY, spells: SPELLBOOK, armory: ARMORY, classes: CLASS_SPEC, races: RACE_SPEC } as const;

/** The facts a card or a sorted list shows beside the name, depending on the sort. */
export function sortFacts(chapter: CodexChapter, sort: string, entry: MonsterData | SpellData | ArmoryItem): string | undefined {
  if (chapter !== "armory") return undefined;
  const i = entry as ArmoryItem;
  if (i.kind === "magic") return sort === "cost" || sort === "weight" ? cap(rarityLabel(i)) : undefined;
  if (sort === "cost") return costLabel(i.costGp);
  if (sort === "weight") return `${i.weight} lb.`;
  return undefined;
}
