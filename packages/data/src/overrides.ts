/**
 * Hand-curated data the SRD JSON cannot express mechanically.
 * Everything here is applied on top of the imported SRD data by scripts/import-srd.ts.
 */
import type { GearData, SpellEffect } from "@dnd/shared";

/** Spell effects that the heuristic importer gets wrong or cannot infer. */
export const SPELL_EFFECT_OVERRIDES: Record<string, SpellEffect> = {
  "magic-missile": { type: "auto-damage", damage: "1d4+1", damageType: "force", count: 3, upcastCount: 1 },
  shield: { type: "buff", description: "+5 AC until the start of your next turn; immune to magic missile." },
  "mage-armor": { type: "buff", description: "Base AC becomes 13 + DEX modifier for 8 hours if not wearing armor." },
  bless: { type: "buff", description: "Up to three creatures add 1d4 to attack rolls and saving throws for 1 minute (concentration)." },
  "shield-of-faith": { type: "buff", description: "+2 AC to one creature for 10 minutes (concentration)." },
  "healing-word": { type: "heal", dice: "1d4", upcast: "1d4" },
  "cure-wounds": { type: "heal", dice: "1d8", upcast: "1d8" },
  "sacred-flame": { type: "save", save: "dex", damage: "1d8", damageType: "radiant", halfOnSave: false },
  "guiding-bolt": { type: "attack", damage: "4d6", damageType: "radiant", upcast: "1d6" },
  "inflict-wounds": { type: "attack", damage: "3d10", damageType: "necrotic", upcast: "1d10" },
  "spiritual-weapon": { type: "attack", damage: "1d8", damageType: "force" },
  thunderwave: { type: "save", save: "con", damage: "2d8", damageType: "thunder", halfOnSave: true, upcast: "1d8" },
  "burning-hands": { type: "save", save: "dex", damage: "3d6", damageType: "fire", halfOnSave: true, upcast: "1d6" },
  "chromatic-orb": { type: "attack", damage: "3d8", damageType: "acid", upcast: "1d8" },
  "scorching-ray": { type: "attack", damage: "2d6", damageType: "fire" },
  "ray-of-frost": { type: "attack", damage: "1d8", damageType: "cold" },
  "fire-bolt": { type: "attack", damage: "1d10", damageType: "fire" },
  "acid-splash": { type: "save", save: "dex", damage: "1d6", damageType: "acid", halfOnSave: false },
  "shocking-grasp": { type: "attack", damage: "1d8", damageType: "lightning" },
  "poison-spray": { type: "save", save: "con", damage: "1d12", damageType: "poison", halfOnSave: false },
};

/** Fixed starting kits for MVP classes (SRD gives choices; we pick sensible defaults). */
export const STARTING_KITS: Record<string, { itemId: string; quantity: number }[]> = {
  fighter: [
    { itemId: "chain-mail", quantity: 1 },
    { itemId: "longsword", quantity: 1 },
    { itemId: "shield", quantity: 1 },
    { itemId: "handaxe", quantity: 2 },
    { itemId: "explorers-pack", quantity: 1 },
    { itemId: "potion-of-healing", quantity: 1 },
  ],
  rogue: [
    { itemId: "leather-armor", quantity: 1 },
    { itemId: "rapier", quantity: 1 },
    { itemId: "shortbow", quantity: 1 },
    { itemId: "arrow", quantity: 20 },
    { itemId: "dagger", quantity: 2 },
    { itemId: "thieves-tools", quantity: 1 },
    { itemId: "burglars-pack", quantity: 1 },
    { itemId: "potion-of-healing", quantity: 1 },
  ],
  wizard: [
    { itemId: "quarterstaff", quantity: 1 },
    { itemId: "dagger", quantity: 1 },
    { itemId: "component-pouch", quantity: 1 },
    { itemId: "spellbook", quantity: 1 },
    { itemId: "scholars-pack", quantity: 1 },
    { itemId: "potion-of-healing", quantity: 1 },
  ],
  cleric: [
    { itemId: "scale-mail", quantity: 1 },
    { itemId: "mace", quantity: 1 },
    { itemId: "shield", quantity: 1 },
    { itemId: "holy-symbol", quantity: 1 },
    { itemId: "priests-pack", quantity: 1 },
    { itemId: "potion-of-healing", quantity: 1 },
  ],
};

/** Consumables from the SRD magic item list, encoded as gear with an effect. */
export const EXTRA_GEAR: GearData[] = [
  { kind: "gear", id: "potion-of-healing", name: "Potion of Healing", description: "You regain 2d4 + 2 hit points when you drink this potion.", weight: 0.5, costGp: 50, effect: { type: "heal", dice: "2d4+2" } },
  { kind: "gear", id: "potion-of-greater-healing", name: "Potion of Greater Healing", description: "You regain 4d4 + 4 hit points when you drink this potion.", weight: 0.5, costGp: 150, effect: { type: "heal", dice: "4d4+4" } },
  { kind: "gear", id: "holy-symbol", name: "Holy Symbol", description: "An amulet or emblem used as a spellcasting focus by clerics.", weight: 1, costGp: 5 },
];

/**
 * What each SRD 5.1 equipment pack holds (DAG-166), by item id. A pack is carried whole; a hero who
 * reaches for a torch or a ration in it opens it, and its gear is carried loose from then on.
 */
export const PACK_CONTENTS: Record<string, { itemId: string; quantity: number }[]> = {
  "burglars-pack": [
    { itemId: "backpack", quantity: 1 }, { itemId: "ball-bearings-bag-of-1000", quantity: 1 }, { itemId: "string-10-feet", quantity: 1 }, { itemId: "bell", quantity: 1 },
    { itemId: "candle", quantity: 5 }, { itemId: "crowbar", quantity: 1 }, { itemId: "hammer", quantity: 1 }, { itemId: "piton", quantity: 10 },
    { itemId: "lantern-hooded", quantity: 1 }, { itemId: "oil-flask", quantity: 2 }, { itemId: "rations-1-day", quantity: 5 }, { itemId: "tinderbox", quantity: 1 },
    { itemId: "waterskin", quantity: 1 }, { itemId: "rope-hempen-50-feet", quantity: 1 },
  ],
  "diplomats-pack": [
    { itemId: "chest", quantity: 1 }, { itemId: "case-map-or-scroll", quantity: 2 }, { itemId: "clothes-fine", quantity: 1 }, { itemId: "ink-1-ounce-bottle", quantity: 1 },
    { itemId: "ink-pen", quantity: 1 }, { itemId: "lamp", quantity: 1 }, { itemId: "oil-flask", quantity: 2 }, { itemId: "paper-one-sheet", quantity: 5 },
    { itemId: "perfume-vial", quantity: 1 }, { itemId: "sealing-wax", quantity: 1 }, { itemId: "soap", quantity: 1 },
  ],
  "dungeoneers-pack": [
    { itemId: "backpack", quantity: 1 }, { itemId: "crowbar", quantity: 1 }, { itemId: "hammer", quantity: 1 }, { itemId: "piton", quantity: 10 },
    { itemId: "torch", quantity: 10 }, { itemId: "tinderbox", quantity: 1 }, { itemId: "rations-1-day", quantity: 10 }, { itemId: "waterskin", quantity: 1 },
    { itemId: "rope-hempen-50-feet", quantity: 1 },
  ],
  "entertainers-pack": [
    { itemId: "backpack", quantity: 1 }, { itemId: "bedroll", quantity: 1 }, { itemId: "clothes-costume", quantity: 2 }, { itemId: "candle", quantity: 5 },
    { itemId: "rations-1-day", quantity: 5 }, { itemId: "waterskin", quantity: 1 }, { itemId: "disguise-kit", quantity: 1 },
  ],
  "explorers-pack": [
    { itemId: "backpack", quantity: 1 }, { itemId: "bedroll", quantity: 1 }, { itemId: "mess-kit", quantity: 1 }, { itemId: "tinderbox", quantity: 1 },
    { itemId: "torch", quantity: 10 }, { itemId: "rations-1-day", quantity: 10 }, { itemId: "waterskin", quantity: 1 }, { itemId: "rope-hempen-50-feet", quantity: 1 },
  ],
  "priests-pack": [
    { itemId: "backpack", quantity: 1 }, { itemId: "blanket", quantity: 1 }, { itemId: "candle", quantity: 10 }, { itemId: "tinderbox", quantity: 1 },
    { itemId: "alms-box", quantity: 1 }, { itemId: "block-of-incense", quantity: 2 }, { itemId: "censer", quantity: 1 }, { itemId: "vestments", quantity: 1 },
    { itemId: "rations-1-day", quantity: 2 }, { itemId: "waterskin", quantity: 1 },
  ],
  "scholars-pack": [
    { itemId: "backpack", quantity: 1 }, { itemId: "book", quantity: 1 }, { itemId: "ink-1-ounce-bottle", quantity: 1 }, { itemId: "ink-pen", quantity: 1 },
    { itemId: "parchment-one-sheet", quantity: 10 }, { itemId: "little-bag-of-sand", quantity: 1 }, { itemId: "small-knife", quantity: 1 },
  ],
};

/** Primary abilities per class, used by point-buy suggestions and AI summaries. */
export const PRIMARY_ABILITIES: Record<string, ("str" | "dex" | "con" | "int" | "wis" | "cha")[]> = {
  barbarian: ["str"],
  bard: ["cha"],
  cleric: ["wis"],
  druid: ["wis"],
  fighter: ["str", "dex"],
  monk: ["dex", "wis"],
  paladin: ["str", "cha"],
  ranger: ["dex", "wis"],
  rogue: ["dex"],
  sorcerer: ["cha"],
  warlock: ["cha"],
  wizard: ["int"],
};

/**
 * Spells added to a class's list (SRD 5.1). The Warlock's patron, the Fiend, is the only patron in
 * the SRD and every warlock here has it, so its expanded spells are part of the warlock list (DAG-65).
 */
export const EXPANDED_SPELLS: Record<string, readonly string[]> = {
  warlock: ["burning-hands", "command", "blindness-deafness", "scorching-ray", "fireball", "stinking-cloud", "fire-shield", "wall-of-fire", "flame-strike", "hallow"],
};

/** Classes fully supported by the engine in the MVP. */
export const MVP_CLASSES = ["fighter", "rogue", "wizard", "cleric", "barbarian", "monk", "paladin", "ranger", "druid", "sorcerer", "warlock", "bard"] as const;
/** Races fully supported in the MVP (each merged with its SRD subrace). */
export const MVP_RACES = ["human", "elf", "dwarf", "halfling", "dragonborn", "gnome", "half-elf", "half-orc", "tiefling"] as const;
