/**
 * One-time importer: normalizes 5e-bits SRD JSON (raw/) into our schema (src/generated/).
 * Run with: pnpm import-srd
 * Source: https://github.com/5e-bits/5e-database (SRD 5.1, CC-BY-4.0)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CONDITIONS, DAMAGE_TYPES } from "@dnd/shared";
import { RARITIES } from "@dnd/shared";
import type { ClassData, ItemData, MagicItemData, MagicItemType, MonsterData, MonsterFeature, Rarity, RaceData, Skill, SpellData, SpellEffect, WeaponProperty } from "@dnd/shared";
import { classesFile, itemsFile, magicItemsFile, monstersFile, racesFile, spellsFile } from "../schemas";
import { EXTRA_GEAR, PRIMARY_ABILITIES, SPELL_EFFECT_OVERRIDES, STARTING_KITS } from "../src/overrides";

const here = dirname(fileURLToPath(import.meta.url));
const RAW = join(here, "..", "raw");
const OUT = join(here, "..", "src", "generated");
mkdirSync(OUT, { recursive: true });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;
const load = (name: string): Raw[] => JSON.parse(readFileSync(join(RAW, `${name}.json`), "utf8"));

const rawClasses = load("Classes");
const rawRaces = load("Races");
const rawSubraces = load("Subraces");
const rawTraits = load("Traits");
const rawSpells = load("Spells");
const rawMonsters = load("Monsters");
const rawEquipment = load("Equipment");
const rawLevels = load("Levels");
const rawFeatures = load("Features");
const rawMagicItems = load("Magic-Items");

const damageTypeSet = new Set<string>(DAMAGE_TYPES);
const conditionSet = new Set<string>(CONDITIONS);
const abilitySet = new Set(["str", "dex", "con", "int", "wis", "cha"]);

const normDice = (s: string): string => s.replace(/\s+/g, "");
const isDice = (s: string) => /^(\d+d\d+([+-]\d+)?|\d+)$/.test(s);
const feet = (s: string | number | undefined): number => (typeof s === "number" ? s : parseInt(String(s ?? "0"), 10) || 0);

// ---------- Classes ----------
// The class tables' own columns, as the SRD prints them (DAG-84). Spellcasting columns come from
// `spellcasting`; the rest of 5e-bits' class_specific values are rules bookkeeping, not columns.
const diceCell = (v: Raw) => (v ? `${v.dice_count}d${v.dice_value}` : "—");
const countCell = (v: Raw) => (v ? String(v) : "—");
const CLASS_COLUMNS: Record<string, { key: string; label: string; cell: (v: Raw) => string }[]> = {
  barbarian: [
    { key: "rage_count", label: "Rages", cell: (v) => (v >= 9999 ? "Unlimited" : String(v)) },
    { key: "rage_damage_bonus", label: "Rage Damage", cell: (v) => `+${v}` },
  ],
  monk: [
    { key: "martial_arts", label: "Martial Arts", cell: diceCell },
    { key: "ki_points", label: "Ki Points", cell: countCell },
    { key: "unarmored_movement", label: "Unarmored Movement", cell: (v) => (v ? `+${v} ft.` : "—") },
  ],
  rogue: [{ key: "sneak_attack", label: "Sneak Attack", cell: diceCell }],
  sorcerer: [{ key: "sorcery_points", label: "Sorcery Points", cell: countCell }],
  warlock: [{ key: "invocations_known", label: "Invocations Known", cell: countCell }],
};
const featureById = new Map<string, Raw>(rawFeatures.map((f: Raw) => [f.index, f]));

const classes: ClassData[] = rawClasses.map((c: Raw) => {
  const profs: string[] = c.proficiencies.map((p: Raw) => p.index);
  const armor = profs.filter((p) => /armor|shields/.test(p));
  const weapons = profs.filter((p) => /weapons?$|bows|swords|daggers|darts|slings|quarterstaffs|crossbows|scimitars|rapiers|shortswords|handaxes|javelins|maces|warhammers|battleaxes|clubs|sickles|spears/.test(p) && !/armor|shields|saving/.test(p));
  const tools = profs.filter((p) => !armor.includes(p) && !weapons.includes(p) && !p.startsWith("saving-throw"));

  const skillChoice = c.proficiency_choices.find((pc: Raw) => pc.from?.options?.[0]?.item?.index?.startsWith("skill-"));
  const skillFrom: Skill[] = skillChoice
    ? skillChoice.from.options.map((o: Raw) => o.item.index.replace(/^skill-/, "") as Skill)
    : [];

  const levels = rawLevels.filter((l: Raw) => l.class.index === c.index && !l.subclass).sort((a: Raw, b: Raw) => a.level - b.level);
  const features = levels.flatMap((l: Raw) =>
    l.features.map((f: Raw) => {
      const full = featureById.get(f.index);
      return { id: f.index, name: f.name, level: l.level, description: (full?.desc ?? []).join("\n") };
    }),
  );

  let spellcasting: ClassData["spellcasting"] | undefined;
  if (c.spellcasting && levels.some((l: Raw) => l.spellcasting)) {
    const cantripsKnown: Record<number, number> = {};
    const slots: Record<number, Record<number, number>> = {};
    const spellsKnown: Record<number, number> = {};
    for (const l of levels) {
      if (!l.spellcasting) continue;
      cantripsKnown[l.level] = l.spellcasting.cantrips_known ?? 0;
      if (l.spellcasting.spells_known) spellsKnown[l.level] = l.spellcasting.spells_known;
      const row: Record<number, number> = {};
      for (let s = 1; s <= 9; s++) row[s] = l.spellcasting[`spell_slots_level_${s}`] ?? 0;
      slots[l.level] = row;
    }
    const ability = c.spellcasting.spellcasting_ability.index as "int" | "wis" | "cha";
    // Classes with a spells-known column know their spells (DAG-57); the Warlock casts through Pact Magic.
    const known = Object.keys(spellsKnown).length > 0;
    const pact = features.some((f: { id: string }) => f.id === "pact-magic");
    spellcasting = {
      ability,
      type: c.index === "wizard" ? "spellbook" : known ? "known" : "prepared",
      cantripsKnown,
      slots,
      ...(known ? { spellsKnown } : {}),
      ...(pact ? { pact: true } : {}),
    };
  }

  const fixedEquipment = (c.starting_equipment ?? []).map((e: Raw) => ({ itemId: e.equipment.index, quantity: e.quantity }));

  return {
    id: c.index,
    name: c.name,
    hitDie: c.hit_die,
    primaryAbilities: PRIMARY_ABILITIES[c.index] ?? [],
    savingThrows: c.saving_throws.map((s: Raw) => s.index),
    skillChoices: { count: skillChoice?.choose ?? 2, from: skillFrom },
    armorProficiencies: armor,
    weaponProficiencies: weapons,
    toolProficiencies: tools,
    startingEquipment: STARTING_KITS[c.index] ?? fixedEquipment,
    features,
    ...(spellcasting ? { spellcasting } : {}),
    ...(CLASS_COLUMNS[c.index] ? { columns: CLASS_COLUMNS[c.index]!.map((col) => ({ label: col.label, values: Object.fromEntries(levels.map((l: Raw) => [l.level, col.cell(l.class_specific?.[col.key])])) })) } : {}),
  } satisfies ClassData;
});

// ---------- Races (merge the single SRD subrace into the base race) ----------
const traitById = new Map<string, Raw>(rawTraits.map((t: Raw) => [t.index, t]));
const races: RaceData[] = rawRaces.map((r: Raw) => {
  const sub = rawSubraces.find((s: Raw) => s.race.index === r.index);
  const bonuses: Record<string, number> = {};
  for (const b of [...r.ability_bonuses, ...(sub?.ability_bonuses ?? [])]) {
    bonuses[b.ability_score.index] = (bonuses[b.ability_score.index] ?? 0) + b.bonus;
  }
  const traitRefs = [...r.traits, ...(sub?.racial_traits ?? [])];
  const traits = traitRefs.map((t: Raw) => {
    const full = traitById.get(t.index);
    return { id: t.index, name: t.name, description: (full?.desc ?? []).join("\n") };
  });
  const darkvision = traits.some((t) => t.id === "darkvision") ? 60 : undefined;
  return {
    id: r.index,
    name: sub ? sub.name : r.name,
    speed: r.speed,
    size: r.size.toLowerCase() as "small" | "medium",
    abilityBonuses: bonuses,
    languages: r.languages.map((l: Raw) => l.name),
    traits,
    ...(darkvision ? { darkvision } : {}),
    ...(sub
      ? {
          subrace: {
            id: sub.index,
            name: sub.name,
            baseName: r.name,
            abilityBonuses: Object.fromEntries(sub.ability_bonuses.map((b: Raw) => [b.ability_score.index, b.bonus])),
            traitIds: sub.racial_traits.map((t: Raw) => t.index),
          },
        }
      : {}),
  } satisfies RaceData;
});

// ---------- Spells ----------
function inferEffect(s: Raw): SpellEffect {
  const override = SPELL_EFFECT_OVERRIDES[s.index];
  if (override) return override;
  const dmg = s.damage;
  const dtype = dmg?.damage_type?.index;
  const base = dmg?.damage_at_slot_level?.[String(s.level)] ?? dmg?.damage_at_character_level?.["1"];
  const next = dmg?.damage_at_slot_level?.[String(s.level + 1)];
  const validType = dtype && damageTypeSet.has(dtype);
  if (s.heal_at_slot_level) {
    const h = normDice(String(s.heal_at_slot_level[String(s.level)] ?? "").replace(/\+?MOD/i, ""));
    if (isDice(h)) return { type: "heal", dice: h };
  }
  if (validType && base && isDice(normDice(base))) {
    const damage = normDice(base);
    const upcast = next && isDice(normDice(next)) ? diffDice(damage, normDice(next)) : undefined;
    if (s.attack_type) return { type: "attack", damage, damageType: dtype, ...(upcast ? { upcast } : {}) };
    if (s.dc?.dc_type?.index && abilitySet.has(s.dc.dc_type.index)) {
      return { type: "save", save: s.dc.dc_type.index, damage, damageType: dtype, halfOnSave: s.dc.dc_success === "half", ...(upcast ? { upcast } : {}) };
    }
  }
  if (s.dc || s.attack_type || s.damage) return { type: "buff", description: s.desc[0] ?? "" };
  return { type: "narrative" };
}

/** "3d6" -> "4d6" yields "1d6"; falls back to undefined if faces differ. */
function diffDice(a: string, b: string): string | undefined {
  const ma = /^(\d+)d(\d+)/.exec(a);
  const mb = /^(\d+)d(\d+)/.exec(b);
  if (!ma || !mb || ma[2] !== mb[2]) return undefined;
  const n = Number(mb[1]) - Number(ma[1]);
  return n > 0 ? `${n}d${ma[2]}` : undefined;
}

const spells: SpellData[] = rawSpells.map((s: Raw) => ({
  id: s.index,
  name: s.name,
  level: s.level,
  school: s.school.index,
  castingTime: s.casting_time,
  range: s.range,
  ...(s.area_of_effect ? { area: { shape: s.area_of_effect.type, size: s.area_of_effect.size } } : {}),
  components: { v: s.components.includes("V"), s: s.components.includes("S"), ...(s.material ? { m: s.material } : {}) },
  duration: s.duration,
  concentration: s.concentration,
  ritual: s.ritual,
  description: s.desc.join("\n"),
  ...(s.higher_level?.length ? { higherLevel: s.higher_level.join("\n") } : {}),
  classes: s.classes.map((c: Raw) => c.index),
  effect: inferEffect(s),
}));

// ---------- Monsters ----------
const monsters: MonsterData[] = rawMonsters.map((m: Raw) => {
  const saves: Record<string, number> = {};
  const skills: Record<string, number> = {};
  for (const p of m.proficiencies ?? []) {
    const idx: string = p.proficiency.index;
    if (idx.startsWith("saving-throw-")) saves[idx.slice("saving-throw-".length)] = p.value;
    else if (idx.startsWith("skill-")) skills[idx.slice("skill-".length)] = p.value;
  }
  const speed: Record<string, number> = {};
  for (const [k, v] of Object.entries(m.speed ?? {})) if (typeof v === "string") speed[k] = feet(v);
  const senses: Record<string, number | string> = {};
  for (const [k, v] of Object.entries(m.senses ?? {})) senses[k] = typeof v === "number" ? v : feet(v as string) || String(v);
  const dmgList = (arr: string[]) => arr.map((d) => d.toLowerCase()).filter((d) => damageTypeSet.has(d)) as MonsterData["resistances"];

  const actions = (m.actions ?? []).map((a: Raw) => {
    const damage = (a.damage ?? [])
      .filter((d: Raw) => d.damage_dice && d.damage_type?.index && damageTypeSet.has(d.damage_type.index))
      .map((d: Raw) => ({ dice: normDice(d.damage_dice), type: d.damage_type.index }))
      .filter((d: { dice: string }) => isDice(d.dice));
    let attack: MonsterData["actions"][number]["attack"];
    if (typeof a.attack_bonus === "number" && damage.length > 0) {
      const reach = /reach (\d+) ft/.exec(a.desc)?.[1];
      const range = /range (\d+)\/(\d+) ft/.exec(a.desc);
      attack = {
        toHit: a.attack_bonus,
        ...(reach ? { reach: Number(reach) } : {}),
        ...(range ? { range: { normal: Number(range[1]), long: Number(range[2]) } } : {}),
        damage,
      };
    }
    return { name: a.name, description: a.desc, ...(attack ? { attack } : {}) };
  });

  // Reactions and legendary actions (DAG-83). 5e-bits leaves out the paragraph that introduces the
  // legendary actions; every SRD 5.1 legendary creature takes three a round, and the paragraph is
  // the SRD's standard wording with the creature's short name, as its own actions call it.
  const feature = (a: Raw): MonsterFeature => ({ name: a.name, description: a.desc });
  const reactions: MonsterFeature[] = (m.reactions ?? []).map(feature);
  let legendary: MonsterData["legendary"];
  if (m.legendary_actions?.length) {
    const text = m.legendary_actions.map((a: Raw) => a.desc).join(" ");
    const short = /\b[Tt]he ([a-z][a-z' -]*?) (?:makes|moves|can|casts|uses|beats|flies|regains|chooses|teleports|telepathically|magically|attempts|targets|emits|unleashes|exhales|swings|takes|plays|glows|blows)\b/.exec(text)?.[1];
    if (!short) throw new Error(`No short name for ${m.index}'s legendary actions`);
    legendary = {
      uses: 3,
      description: `The ${short} can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The ${short} regains spent legendary actions at the start of its turn.`,
      actions: m.legendary_actions.map(feature),
    };
  }

  const hpDice = normDice(m.hit_points_roll ?? m.hit_dice ?? "1d8");
  return {
    id: m.index,
    name: m.name,
    size: m.size.toLowerCase(),
    type: m.type,
    alignment: m.alignment,
    ac: m.armor_class?.[0]?.value ?? 10,
    hp: { average: m.hit_points, dice: isDice(hpDice) ? hpDice : "1d8" },
    speed,
    abilities: { str: m.strength, dex: m.dexterity, con: m.constitution, int: m.intelligence, wis: m.wisdom, cha: m.charisma },
    saves,
    skills,
    resistances: dmgList(m.damage_resistances ?? []),
    immunities: dmgList(m.damage_immunities ?? []),
    vulnerabilities: dmgList(m.damage_vulnerabilities ?? []),
    conditionImmunities: (m.condition_immunities ?? []).map((c: Raw) => c.index).filter((c: string) => conditionSet.has(c)),
    senses,
    languages: m.languages ?? "",
    cr: m.challenge_rating,
    xp: m.xp ?? 0,
    traits: (m.special_abilities ?? []).map((t: Raw) => ({ name: t.name, description: t.desc })),
    actions,
    ...(reactions.length ? { reactions } : {}),
    ...(legendary ? { legendary } : {}),
  } satisfies MonsterData;
});

// ---------- Items ----------
const toGp = (cost: Raw): number => {
  if (!cost) return 0;
  const q = cost.quantity ?? 0;
  return cost.unit === "gp" ? q : cost.unit === "sp" ? q / 10 : cost.unit === "cp" ? q / 100 : cost.unit === "pp" ? q * 10 : q;
};

const items: ItemData[] = [];
for (const e of rawEquipment) {
  const cat = e.equipment_category?.index;
  if (cat === "weapon" && e.damage?.damage_dice) {
    const dtype = e.damage.damage_type.index;
    if (!damageTypeSet.has(dtype)) continue;
    const props: WeaponProperty[] = (e.properties ?? []).map((p: Raw) => p.index);
    const range = e.weapon_range === "Ranged" ? e.range : e.throw_range;
    items.push({
      kind: "weapon",
      id: e.index,
      name: e.name,
      category: e.weapon_category.toLowerCase(),
      rangeType: e.weapon_range.toLowerCase(),
      damage: { dice: normDice(e.damage.damage_dice), type: dtype },
      ...(e.two_handed_damage ? { versatileDamage: { dice: normDice(e.two_handed_damage.damage_dice), type: e.two_handed_damage.damage_type.index } } : {}),
      properties: props,
      ...(range?.long ? { range: { normal: range.normal, long: range.long } } : {}),
      weight: e.weight ?? 0,
      costGp: toGp(e.cost),
    });
  } else if (cat === "armor") {
    items.push({
      kind: "armor",
      id: e.index,
      name: e.name,
      category: e.armor_category.toLowerCase(),
      baseAc: e.armor_class.base,
      dexBonus: e.armor_class.dex_bonus,
      ...(e.armor_class.max_bonus ? { maxDexBonus: e.armor_class.max_bonus } : {}),
      ...(e.str_minimum ? { strMin: e.str_minimum } : {}),
      stealthDisadvantage: !!e.stealth_disadvantage,
      weight: e.weight ?? 0,
      costGp: toGp(e.cost),
    });
  } else if (cat === "adventuring-gear" || cat === "tools") {
    items.push({
      kind: "gear",
      id: e.index,
      name: e.name,
      ...(e.desc?.length ? { description: e.desc.join("\n") } : {}),
      weight: e.weight ?? 0,
      costGp: toGp(e.cost),
    });
  }
}
items.push(...EXTRA_GEAR);

// ---------- Magic items (DAG-83) ----------
// One entry per item as the SRD lists it. 5e-bits also lists each form of some items as a "variant"
// ("Dragon Scale Mail (Black)"); the parent's own text already covers them, so only their rarities
// are kept, for an item whose rarity varies.
const rarityOf = (name: string): Rarity | "varies" => {
  const r = name.toLowerCase();
  if (r === "varies") return "varies";
  if (!(RARITIES as readonly string[]).includes(r)) throw new Error(`Unknown rarity ${name}`);
  return r as Rarity;
};
const magicById = new Map<string, Raw>(rawMagicItems.map((i: Raw) => [i.index, i]));

/**
 * Two roll tables in the source fold a row into the one above it ("| 11-15 | You are stunned…
 * 16-20 You cast gust of wind. |", the Wand of Wonder and the Robe of Useful Items). A range that
 * starts right after the row's own range, inside its last cell, is split back into its own row.
 */
function unfoldTableRows(lines: string[]): string[] {
  return lines.flatMap((line) => {
    if (!line.startsWith("|")) return [line];
    const cells = line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    const range = /^(\d+)(?:-(\d+))?$/.exec(cells[0]!);
    if (!range) return [line];
    const hi = Number(range[2] ?? range[1]);
    const last = cells.at(-1)!;
    const fold = [...last.matchAll(/\s(\d{1,3})-(\d{1,3})\s+(?=[A-Z])/g)].find((m) => Number(m[1]) === hi + 1);
    if (!fold) return [line];
    const before = last.slice(0, fold.index).trim();
    const after = last.slice(fold.index! + fold[0].length).trim();
    return [`| ${[...cells.slice(0, -1), before].join(" | ")} |`, `| ${fold[1]}-${fold[2]} | ${after} |`];
  });
}

/**
 * Who can attune to an item, from its heading; or, when only one of its properties needs
 * attunement (the Hammer of Thunderbolts' "Giant's Bane (Requires Attunement)"), that property.
 */
function attunementOf(heading: string, body: string[]): true | string | undefined {
  const head = /\(requires attunement(?: ([^)]+))?\)/i.exec(heading);
  if (head) return head[1]?.trim() || true;
  const property = body.map((l) => /^([^.|]+?) \(requires attunement\)\./i.exec(l)?.[1]).find(Boolean);
  return property ? `for its ${property} property` : undefined;
}
const gearIds = new Set(items.map((i) => i.id));
const magicItems: MagicItemData[] = rawMagicItems
  .filter((i: Raw) => !i.variant)
  .map((i: Raw) => {
    // Two headings have typos in the source ("Wondous item", "Wondrous Items").
    const heading = String(i.desc[0]).replace(/^Wondr?ous items?/i, "Wondrous item");
    const type = /^(armor|weapon|potion|ring|rod|scroll|staff|wand|wondrous item)\b/i.exec(heading)?.[1]?.toLowerCase() as MagicItemType | undefined;
    if (!type) throw new Error(`No type in ${i.index}'s heading: ${heading}`);
    const rarity = rarityOf(i.rarity.name);
    const forms: Rarity[] = (i.variants ?? []).map((v: Raw) => rarityOf(magicById.get(v.index).rarity.name));
    const rarities = RARITIES.filter((r) => forms.includes(r));
    const body = unfoldTableRows(i.desc.slice(1));
    const attunement = attunementOf(heading, body);
    // The magic Potion of Healing shares its id with the engine's potion (gear). It's the table of
    // all four potions of healing, so it's listed under that name.
    const clash = gearIds.has(i.index);
    return {
      kind: "magic",
      id: clash ? "potions-of-healing" : i.index,
      name: clash ? "Potions of Healing" : i.name,
      type,
      rarity,
      ...(rarity === "varies" && rarities.length ? { rarities } : {}),
      ...(attunement ? { attunement } : {}),
      heading,
      description: body.join("\n"),
    } satisfies MagicItemData;
  });

// ---------- Validate + write ----------
function write(name: string, data: unknown, schema: { parse: (d: unknown) => unknown }) {
  schema.parse(data);
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(data, null, 1) + "\n");
  console.log(`${name}: ${(data as unknown[]).length}`);
}
write("classes", classes, classesFile);
write("races", races, racesFile);
write("spells", spells, spellsFile);
write("monsters", monsters, monstersFile);
write("items", items, itemsFile);
write("magic-items", magicItems, magicItemsFile);

// Sanity: every MVP starting kit item must exist.
const itemIds = new Set(items.map((i) => i.id));
for (const [cls, kit] of Object.entries(STARTING_KITS)) {
  for (const k of kit) if (!itemIds.has(k.itemId)) console.warn(`WARN: ${cls} kit references unknown item ${k.itemId}`);
}
