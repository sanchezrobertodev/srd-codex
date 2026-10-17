// Starting equipment (DAG-51): each playable class's SRD 5.1 equipment, as fixed items plus
// pick-one choices, and every class's starting gold for those who buy their own instead. The
// choices are written out here because the raw SRD files aren't committed.

export interface KitItem {
  itemId: string;
  quantity: number;
}

/** Items the player names from a list, such as "a martial weapon". */
export type PickFrom = "simple-weapon" | "simple-melee-weapon" | "martial-weapon" | "martial-melee-weapon" | "arcane-focus" | "druidic-focus" | "musical-instrument";

export interface KitOption {
  id: string;
  /** As the SRD words it, e.g. "Leather armor, a longbow and 20 arrows". */
  label: string;
  items: KitItem[];
  /** Items to name from a list, with sensible defaults. */
  picks?: { from: PickFrom; count: number; defaults: string[] };
  /** Why the option can't be taken, when it can't. */
  unavailable?: string;
  /** "If proficient" in the SRD: only a hero proficient with its weapons and armor can take it. */
  ifProficient?: boolean;
}

export interface KitChoice {
  id: string;
  label: string;
  options: KitOption[];
}

export interface ClassKit {
  /** Given whatever is chosen. */
  fixed: KitItem[];
  choices: KitChoice[];
}

const one = (itemId: string, quantity = 1): KitItem => ({ itemId, quantity });

/** A potion of healing: this game's gift to every new hero, not part of the SRD kits. */
const GIFT = one("potion-of-healing");

export const CLASS_KITS: Record<string, ClassKit> = {
  // SRD 5.1 Barbarian (DAG-58): a great weapon, a second one, and javelins to throw.
  barbarian: {
    fixed: [one("explorers-pack"), one("javelin", 4), GIFT],
    choices: [
      {
        id: "barbarian-weapon",
        label: "Weapon",
        options: [
          { id: "greataxe", label: "A greataxe", items: [one("greataxe")] },
          { id: "martial-melee", label: "Any martial melee weapon", items: [], picks: { from: "martial-melee-weapon", count: 1, defaults: ["battleaxe"] } },
        ],
      },
      {
        id: "barbarian-second",
        label: "Second weapon",
        options: [
          { id: "handaxes", label: "Two handaxes", items: [one("handaxe", 2)] },
          { id: "simple", label: "Any simple weapon", items: [], picks: { from: "simple-weapon", count: 1, defaults: ["spear"] } },
        ],
      },
    ],
  },
  // SRD 5.1 Monk (DAG-61): a shortsword or a simple weapon, a pack, and ten darts.
  monk: {
    fixed: [one("dart", 10), GIFT],
    choices: [
      {
        id: "monk-weapon",
        label: "Weapon",
        options: [
          { id: "shortsword", label: "A shortsword", items: [one("shortsword")] },
          { id: "simple", label: "Any simple weapon", items: [], picks: { from: "simple-weapon", count: 1, defaults: ["quarterstaff"] } },
        ],
      },
      {
        id: "monk-pack",
        label: "Pack",
        options: [
          { id: "dungeoneers", label: "A dungeoneer's pack", items: [one("dungeoneers-pack")] },
          { id: "explorers", label: "An explorer's pack", items: [one("explorers-pack")] },
        ],
      },
    ],
  },
  // SRD 5.1 Paladin (DAG-62): chain mail and a holy symbol, a martial weapon and a shield or two
  // martial weapons, javelins or a simple melee weapon, and a pack.
  paladin: {
    fixed: [one("chain-mail"), one("holy-symbol"), GIFT],
    choices: [
      {
        id: "paladin-weapons",
        label: "Weapons",
        options: [
          { id: "martial-shield", label: "A martial weapon and a shield", items: [one("shield")], picks: { from: "martial-weapon", count: 1, defaults: ["longsword"] } },
          { id: "two-martial", label: "Two martial weapons", items: [], picks: { from: "martial-weapon", count: 2, defaults: ["greatsword", "warhammer"] } },
        ],
      },
      {
        id: "paladin-second",
        label: "Second weapon",
        options: [
          { id: "javelins", label: "Five javelins", items: [one("javelin", 5)] },
          { id: "simple-melee", label: "Any simple melee weapon", items: [], picks: { from: "simple-melee-weapon", count: 1, defaults: ["mace"] } },
        ],
      },
      {
        id: "paladin-pack",
        label: "Pack",
        options: [
          { id: "priests", label: "A priest's pack", items: [one("priests-pack")] },
          { id: "explorers", label: "An explorer's pack", items: [one("explorers-pack")] },
        ],
      },
    ],
  },
  // SRD 5.1 Ranger (DAG-63): armor, two melee weapons, a pack, and a longbow with a quiver of arrows.
  ranger: {
    fixed: [one("longbow"), one("quiver"), one("arrow", 20), GIFT],
    choices: [
      {
        id: "ranger-armor",
        label: "Armor",
        options: [
          { id: "scale-mail", label: "Scale mail", items: [one("scale-mail")] },
          { id: "leather-armor", label: "Leather armor", items: [one("leather-armor")] },
        ],
      },
      {
        id: "ranger-weapons",
        label: "Weapons",
        options: [
          { id: "shortswords", label: "Two shortswords", items: [one("shortsword", 2)] },
          { id: "simple-melee", label: "Two simple melee weapons", items: [], picks: { from: "simple-melee-weapon", count: 2, defaults: ["handaxe", "spear"] } },
        ],
      },
      {
        id: "ranger-pack",
        label: "Pack",
        options: [
          { id: "dungeoneers", label: "A dungeoneer's pack", items: [one("dungeoneers-pack")] },
          { id: "explorers", label: "An explorer's pack", items: [one("explorers-pack")] },
        ],
      },
    ],
  },
  // SRD 5.1 Druid (DAG-60): leather armor, an explorer's pack and a druidic focus, with a wooden
  // shield or a simple weapon, and a scimitar or a simple melee weapon.
  druid: {
    fixed: [one("leather-armor"), one("explorers-pack"), GIFT],
    choices: [
      {
        id: "druid-shield",
        label: "Shield or weapon",
        options: [
          { id: "wooden-shield", label: "A wooden shield", items: [one("shield")] },
          { id: "simple", label: "Any simple weapon", items: [], picks: { from: "simple-weapon", count: 1, defaults: ["quarterstaff"] } },
        ],
      },
      {
        id: "druid-weapon",
        label: "Weapon",
        options: [
          { id: "scimitar", label: "A scimitar", items: [one("scimitar")] },
          { id: "simple-melee", label: "Any simple melee weapon", items: [], picks: { from: "simple-melee-weapon", count: 1, defaults: ["club"] } },
        ],
      },
      {
        id: "druid-focus",
        label: "Druidic focus",
        options: [{ id: "druidic-focus", label: "A druidic focus", items: [], picks: { from: "druidic-focus", count: 1, defaults: ["sprig-of-mistletoe"] } }],
      },
    ],
  },
  // SRD 5.1 Sorcerer (DAG-64): a crossbow or a simple weapon, a focus, a pack, and two daggers.
  sorcerer: {
    fixed: [one("dagger", 2), GIFT],
    choices: [
      {
        id: "sorcerer-weapon",
        label: "Weapon",
        options: [
          { id: "crossbow", label: "A light crossbow and 20 bolts", items: [one("crossbow-light"), one("crossbow-bolt", 20)] },
          { id: "simple", label: "Any simple weapon", items: [], picks: { from: "simple-weapon", count: 1, defaults: ["quarterstaff"] } },
        ],
      },
      {
        id: "sorcerer-focus",
        label: "Spellcasting focus",
        options: [
          { id: "component-pouch", label: "A component pouch", items: [one("component-pouch")] },
          { id: "arcane-focus", label: "An arcane focus", items: [], picks: { from: "arcane-focus", count: 1, defaults: ["crystal"] } },
        ],
      },
      {
        id: "sorcerer-pack",
        label: "Pack",
        options: [
          { id: "dungeoneers", label: "A dungeoneer's pack", items: [one("dungeoneers-pack")] },
          { id: "explorers", label: "An explorer's pack", items: [one("explorers-pack")] },
        ],
      },
    ],
  },
  // SRD 5.1 Warlock (DAG-65): a crossbow or a simple weapon, a focus, a pack, leather armor, any
  // simple weapon and two daggers.
  warlock: {
    fixed: [one("leather-armor"), one("dagger", 2), GIFT],
    choices: [
      {
        id: "warlock-weapon",
        label: "Weapon",
        options: [
          { id: "crossbow", label: "A light crossbow and 20 bolts", items: [one("crossbow-light"), one("crossbow-bolt", 20)] },
          { id: "simple", label: "Any simple weapon", items: [], picks: { from: "simple-weapon", count: 1, defaults: ["quarterstaff"] } },
        ],
      },
      {
        id: "warlock-focus",
        label: "Spellcasting focus",
        options: [
          { id: "component-pouch", label: "A component pouch", items: [one("component-pouch")] },
          { id: "arcane-focus", label: "An arcane focus", items: [], picks: { from: "arcane-focus", count: 1, defaults: ["rod"] } },
        ],
      },
      {
        id: "warlock-pack",
        label: "Pack",
        options: [
          { id: "scholars", label: "A scholar's pack", items: [one("scholars-pack")] },
          { id: "dungeoneers", label: "A dungeoneer's pack", items: [one("dungeoneers-pack")] },
        ],
      },
      {
        id: "warlock-second",
        label: "Second weapon",
        options: [{ id: "simple", label: "Any simple weapon", items: [], picks: { from: "simple-weapon", count: 1, defaults: ["mace"] } }],
      },
    ],
  },
  // SRD 5.1 Bard (DAG-59): a rapier, a longsword or a simple weapon, a pack, an instrument, leather
  // armor and a dagger.
  bard: {
    fixed: [one("leather-armor"), one("dagger"), GIFT],
    choices: [
      {
        id: "bard-weapon",
        label: "Weapon",
        options: [
          { id: "rapier", label: "A rapier", items: [one("rapier")] },
          { id: "longsword", label: "A longsword", items: [one("longsword")] },
          { id: "simple", label: "Any simple weapon", items: [], picks: { from: "simple-weapon", count: 1, defaults: ["quarterstaff"] } },
        ],
      },
      {
        id: "bard-pack",
        label: "Pack",
        options: [
          { id: "diplomats", label: "A diplomat's pack", items: [one("diplomats-pack")] },
          { id: "entertainers", label: "An entertainer's pack", items: [one("entertainers-pack")] },
        ],
      },
      {
        id: "bard-instrument",
        label: "Instrument",
        options: [
          { id: "lute", label: "A lute", items: [one("lute")] },
          { id: "other", label: "Any other musical instrument", items: [], picks: { from: "musical-instrument", count: 1, defaults: ["lyre"] } },
        ],
      },
    ],
  },
  fighter: {
    fixed: [GIFT],
    choices: [
      {
        id: "fighter-armor",
        label: "Armor",
        options: [
          { id: "chain-mail", label: "Chain mail", items: [one("chain-mail")] },
          { id: "leather-longbow", label: "Leather armor, a longbow and 20 arrows", items: [one("leather-armor"), one("longbow"), one("arrow", 20)] },
        ],
      },
      {
        id: "fighter-weapons",
        label: "Weapons",
        options: [
          { id: "martial-shield", label: "A martial weapon and a shield", items: [one("shield")], picks: { from: "martial-weapon", count: 1, defaults: ["longsword"] } },
          { id: "two-martial", label: "Two martial weapons", items: [], picks: { from: "martial-weapon", count: 2, defaults: ["greatsword", "longsword"] } },
        ],
      },
      {
        id: "fighter-ranged",
        label: "Ranged",
        options: [
          { id: "crossbow", label: "A light crossbow and 20 bolts", items: [one("crossbow-light"), one("crossbow-bolt", 20)] },
          { id: "handaxes", label: "Two handaxes", items: [one("handaxe", 2)] },
        ],
      },
      {
        id: "fighter-pack",
        label: "Pack",
        options: [
          { id: "dungeoneers", label: "A dungeoneer's pack", items: [one("dungeoneers-pack")] },
          { id: "explorers", label: "An explorer's pack", items: [one("explorers-pack")] },
        ],
      },
    ],
  },
  rogue: {
    fixed: [one("leather-armor"), one("dagger", 2), one("thieves-tools"), GIFT],
    choices: [
      {
        id: "rogue-weapon",
        label: "Weapon",
        options: [
          { id: "rapier", label: "A rapier", items: [one("rapier")] },
          { id: "shortsword", label: "A shortsword", items: [one("shortsword")] },
        ],
      },
      {
        id: "rogue-ranged",
        label: "Second weapon",
        options: [
          { id: "shortbow", label: "A shortbow and a quiver of 20 arrows", items: [one("shortbow"), one("quiver"), one("arrow", 20)] },
          { id: "shortsword", label: "A shortsword", items: [one("shortsword")] },
        ],
      },
      {
        id: "rogue-pack",
        label: "Pack",
        options: [
          { id: "burglars", label: "A burglar's pack", items: [one("burglars-pack")] },
          { id: "dungeoneers", label: "A dungeoneer's pack", items: [one("dungeoneers-pack")] },
          { id: "explorers", label: "An explorer's pack", items: [one("explorers-pack")] },
        ],
      },
    ],
  },
  wizard: {
    fixed: [one("spellbook"), GIFT],
    choices: [
      {
        id: "wizard-weapon",
        label: "Weapon",
        options: [
          { id: "quarterstaff", label: "A quarterstaff", items: [one("quarterstaff")] },
          { id: "dagger", label: "A dagger", items: [one("dagger")] },
        ],
      },
      {
        id: "wizard-focus",
        label: "Spellcasting focus",
        options: [
          { id: "component-pouch", label: "A component pouch", items: [one("component-pouch")] },
          { id: "arcane-focus", label: "An arcane focus", items: [], picks: { from: "arcane-focus", count: 1, defaults: ["wand"] } },
        ],
      },
      {
        id: "wizard-pack",
        label: "Pack",
        options: [
          { id: "scholars", label: "A scholar's pack", items: [one("scholars-pack")] },
          { id: "explorers", label: "An explorer's pack", items: [one("explorers-pack")] },
        ],
      },
    ],
  },
  cleric: {
    fixed: [one("shield"), one("holy-symbol"), GIFT],
    choices: [
      {
        id: "cleric-weapon",
        label: "Weapon",
        options: [
          { id: "mace", label: "A mace", items: [one("mace")] },
          { id: "warhammer", label: "A warhammer (if proficient)", items: [one("warhammer")], ifProficient: true },
        ],
      },
      {
        id: "cleric-armor",
        label: "Armor",
        options: [
          { id: "scale-mail", label: "Scale mail", items: [one("scale-mail")] },
          { id: "leather-armor", label: "Leather armor", items: [one("leather-armor")] },
          { id: "chain-mail", label: "Chain mail (if proficient)", items: [one("chain-mail")], ifProficient: true },
        ],
      },
      {
        id: "cleric-ranged",
        label: "Second weapon",
        options: [
          { id: "crossbow", label: "A light crossbow and 20 bolts", items: [one("crossbow-light"), one("crossbow-bolt", 20)] },
          { id: "simple", label: "Any simple weapon", items: [], picks: { from: "simple-weapon", count: 1, defaults: ["light-hammer"] } },
        ],
      },
      {
        id: "cleric-pack",
        label: "Pack",
        options: [
          { id: "priests", label: "A priest's pack", items: [one("priests-pack")] },
          { id: "explorers", label: "An explorer's pack", items: [one("explorers-pack")] },
        ],
      },
    ],
  },
};

/** The SRD's arcane focuses, as item ids (simple and martial weapons come from the item list). */
export const ARCANE_FOCUSES = ["crystal", "orb", "rod", "staff", "wand"];

/** The SRD's druidic focuses (DAG-60). */
export const DRUIDIC_FOCUSES = ["sprig-of-mistletoe", "totem", "wooden-staff", "yew-wand"];

/** Body armor with metal in it, which a druid won't wear (SRD 5.1). Hide, leather and padded armor aren't; a druid's shield is wooden. */
export const METAL_ARMOR = ["chain-shirt", "scale-mail", "breastplate", "half-plate-armor", "ring-mail", "chain-mail", "splint-armor", "plate-armor"];

/** SRD 5.1 "Starting Wealth by Class": dice of gold pieces, times a multiplier. */
export const STARTING_GOLD: Record<string, { dice: string; multiplier: number }> = {
  barbarian: { dice: "2d4", multiplier: 10 },
  bard: { dice: "5d4", multiplier: 10 },
  cleric: { dice: "5d4", multiplier: 10 },
  druid: { dice: "2d4", multiplier: 10 },
  fighter: { dice: "5d4", multiplier: 10 },
  monk: { dice: "5d4", multiplier: 1 },
  paladin: { dice: "5d4", multiplier: 10 },
  ranger: { dice: "5d4", multiplier: 10 },
  rogue: { dice: "4d4", multiplier: 10 },
  sorcerer: { dice: "3d4", multiplier: 10 },
  warlock: { dice: "4d4", multiplier: 10 },
  wizard: { dice: "4d4", multiplier: 10 },
};
