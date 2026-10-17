import { z } from "zod";
import { ABILITIES, CONDITIONS, DAMAGE_TYPES, SKILL_LIST } from "@dnd/shared";
import type { Skill } from "@dnd/shared";

const ability = z.enum(ABILITIES);
const skill = z.enum(SKILL_LIST as [Skill, ...Skill[]]);
const damageType = z.enum(DAMAGE_TYPES);
const condition = z.enum(CONDITIONS);
const dice = z.string().regex(/^(\d+d\d+([+-]\d+)?|\d+)$/, "dice expression like 2d6+3 or a flat number");

const numRecord = z.record(z.coerce.number(), z.number());

export const classSchema = z.object({
  id: z.string(),
  name: z.string(),
  hitDie: z.number().int(),
  primaryAbilities: z.array(ability),
  savingThrows: z.array(ability),
  skillChoices: z.object({ count: z.number().int(), from: z.array(skill) }),
  armorProficiencies: z.array(z.string()),
  weaponProficiencies: z.array(z.string()),
  toolProficiencies: z.array(z.string()),
  startingEquipment: z.array(z.object({ itemId: z.string(), quantity: z.number().int() })),
  features: z.array(z.object({ id: z.string(), name: z.string(), level: z.number().int(), description: z.string() })),
  spellcasting: z
    .object({
      ability: z.enum(["int", "wis", "cha"]),
      type: z.enum(["prepared", "spellbook", "known"]),
      cantripsKnown: numRecord,
      slots: z.record(z.coerce.number(), numRecord),
      spellsKnown: numRecord.optional(),
      pact: z.boolean().optional(),
    })
    .optional(),
  columns: z.array(z.object({ label: z.string(), values: z.record(z.coerce.number(), z.string()) })).optional(),
});

export const raceSchema = z.object({
  id: z.string(),
  name: z.string(),
  speed: z.number().int(),
  size: z.enum(["small", "medium"]),
  abilityBonuses: z.partialRecord(ability, z.number()),
  languages: z.array(z.string()),
  traits: z.array(z.object({ id: z.string(), name: z.string(), description: z.string() })),
  darkvision: z.number().int().optional(),
  subrace: z
    .object({ id: z.string(), name: z.string(), baseName: z.string(), abilityBonuses: z.partialRecord(ability, z.number()), traitIds: z.array(z.string()) })
    .optional(),
});

const spellEffect = z.discriminatedUnion("type", [
  z.object({ type: z.literal("attack"), damage: dice, damageType, upcast: dice.optional() }),
  z.object({ type: z.literal("save"), save: ability, damage: dice, damageType, halfOnSave: z.boolean(), upcast: dice.optional() }),
  z.object({ type: z.literal("auto-damage"), damage: dice, damageType, count: z.number().int(), upcastCount: z.number().int().optional() }),
  z.object({ type: z.literal("heal"), dice, upcast: dice.optional() }),
  z.object({ type: z.literal("buff"), description: z.string() }),
  z.object({ type: z.literal("narrative") }),
]);

export const spellSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().int().min(0).max(9),
  school: z.enum(["abjuration", "conjuration", "divination", "enchantment", "evocation", "illusion", "necromancy", "transmutation"]),
  castingTime: z.string(),
  range: z.string(),
  area: z.object({ shape: z.enum(["sphere", "cube", "cone", "line", "cylinder"]), size: z.number() }).optional(),
  components: z.object({ v: z.boolean(), s: z.boolean(), m: z.string().optional() }),
  duration: z.string(),
  concentration: z.boolean(),
  ritual: z.boolean(),
  description: z.string(),
  higherLevel: z.string().optional(),
  classes: z.array(z.string()),
  effect: spellEffect,
});

const monsterUsage = z.object({ type: z.string(), dice: z.string().optional(), min_value: z.number().optional(), times: z.number().optional(), rest_types: z.array(z.string()).optional() });
export const monsterSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.enum(["tiny", "small", "medium", "large", "huge", "gargantuan"]),
  type: z.string(),
  alignment: z.string(),
  ac: z.number().int(),
  hp: z.object({ average: z.number().int(), dice: dice }),
  speed: z.record(z.string(), z.number()),
  abilities: z.object({ str: z.number(), dex: z.number(), con: z.number(), int: z.number(), wis: z.number(), cha: z.number() }),
  saves: z.partialRecord(ability, z.number()),
  skills: z.record(z.string(), z.number()),
  resistances: z.array(damageType),
  immunities: z.array(damageType),
  vulnerabilities: z.array(damageType),
  conditionImmunities: z.array(condition),
  senses: z.record(z.string(), z.union([z.number(), z.string()])),
  languages: z.string(),
  cr: z.number(),
  xp: z.number().int(),
  spellcasting: z.array(z.object({
    level: z.number().optional(), ability: z.object({ index: ability }), dc: z.number().optional(), modifier: z.number().optional(),
    slots: z.record(z.string(), z.number()).optional(),
    spells: z.array(z.object({ name: z.string(), level: z.number(), url: z.string(), notes: z.string().optional(), usage: monsterUsage.optional() })),
  })).optional(),
  traits: z.array(z.object({ name: z.string(), description: z.string(), usage: monsterUsage.optional() })),
  actions: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
        usage: monsterUsage.optional(),
        attack: z
        .object({
          toHit: z.number().int(),
          reach: z.number().optional(),
          range: z.object({ normal: z.number(), long: z.number() }).optional(),
          damage: z.array(z.object({ dice, type: damageType })),
        })
        .optional(),
    }),
  ),
  reactions: z.array(z.object({ name: z.string(), description: z.string() })).optional(),
  legendary: z
    .object({
      uses: z.number().int().positive(),
      description: z.string(),
      actions: z.array(z.object({ name: z.string(), description: z.string() })).min(1),
    })
    .optional(),
});

const damageSpec = z.object({ dice, type: damageType });

export const itemSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("weapon"),
    id: z.string(),
    name: z.string(),
    category: z.enum(["simple", "martial"]),
    rangeType: z.enum(["melee", "ranged"]),
    damage: damageSpec,
    versatileDamage: damageSpec.optional(),
    properties: z.array(z.enum(["ammunition", "finesse", "heavy", "light", "loading", "reach", "special", "thrown", "two-handed", "versatile", "monk"])),
    range: z.object({ normal: z.number(), long: z.number() }).optional(),
    weight: z.number(),
    costGp: z.number(),
  }),
  z.object({
    kind: z.literal("armor"),
    id: z.string(),
    name: z.string(),
    category: z.enum(["light", "medium", "heavy", "shield"]),
    baseAc: z.number().int(),
    dexBonus: z.boolean(),
    maxDexBonus: z.number().int().optional(),
    strMin: z.number().int().optional(),
    stealthDisadvantage: z.boolean(),
    weight: z.number(),
    costGp: z.number(),
  }),
  z.object({
    kind: z.literal("gear"),
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    weight: z.number(),
    costGp: z.number(),
    effect: z.union([z.object({ type: z.literal("heal"), dice }), z.object({ type: z.literal("none") })]).optional(),
  }),
]);

// The importer builds each record with `satisfies <SharedType>`, which keeps these
// schemas honest at the point where data is produced.

export const classesFile = z.array(classSchema);
export const racesFile = z.array(raceSchema);
export const spellsFile = z.array(spellSchema);
export const monstersFile = z.array(monsterSchema);
export const itemsFile = z.array(itemSchema);

const rarity = z.enum(["common", "uncommon", "rare", "very rare", "legendary", "artifact"]);
export const magicItemSchema = z.object({
  kind: z.literal("magic"),
  id: z.string(),
  name: z.string(),
  type: z.enum(["armor", "weapon", "potion", "ring", "rod", "scroll", "staff", "wand", "wondrous item"]),
  rarity: z.union([rarity, z.literal("varies")]),
  rarities: z.array(rarity).optional(),
  attunement: z.union([z.literal(true), z.string()]).optional(),
  heading: z.string(),
  description: z.string(),
});
export const magicItemsFile = z.array(magicItemSchema);
