import type { Ability, DamageType } from "./abilities";

export type WeaponProperty =
  | "ammunition"
  | "finesse"
  | "heavy"
  | "light"
  | "loading"
  | "reach"
  | "special"
  | "thrown"
  | "two-handed"
  | "versatile"
  | "monk";

export interface DamageSpec {
  /** Dice expression such as "1d8" */
  dice: string;
  type: DamageType;
}

export interface WeaponData {
  kind: "weapon";
  id: string;
  name: string;
  category: "simple" | "martial";
  rangeType: "melee" | "ranged";
  damage: DamageSpec;
  versatileDamage?: DamageSpec;
  properties: WeaponProperty[];
  range?: { normal: number; long: number };
  weight: number;
  costGp: number;
}

export interface ArmorData {
  kind: "armor";
  id: string;
  name: string;
  category: "light" | "medium" | "heavy" | "shield";
  baseAc: number;
  dexBonus: boolean;
  maxDexBonus?: number;
  strMin?: number;
  stealthDisadvantage: boolean;
  weight: number;
  costGp: number;
}

export interface GearData {
  kind: "gear";
  id: string;
  name: string;
  description?: string;
  weight: number;
  costGp: number;
  /** Consumable effect, e.g. potion of healing */
  effect?: { type: "heal"; dice: string } | { type: "none" };
}

export type ItemData = WeaponData | ArmorData | GearData;

/** The kinds of magic item the SRD lists, as its headings name them. */
export type MagicItemType = "armor" | "weapon" | "potion" | "ring" | "rod" | "scroll" | "staff" | "wand" | "wondrous item";
export const RARITIES = ["common", "uncommon", "rare", "very rare", "legendary", "artifact"] as const;
export type Rarity = (typeof RARITIES)[number];

/**
 * An SRD 5.1 magic item (DAG-83). Reference data for the Codex: it isn't an `ItemData`, so the
 * engine's weapons, armor and gear are untouched until a story brings magic items into play.
 */
export interface MagicItemData {
  kind: "magic";
  id: string;
  name: string;
  type: MagicItemType;
  /** Its rarity, or "varies" when its forms differ (their rarities are in `rarities`). */
  rarity: Rarity | "varies";
  /** For an item whose rarity varies: the rarities of its forms, lowest first. */
  rarities?: Rarity[];
  /** Whether it needs attunement: true, or who can attune to it ("by a cleric or paladin"). */
  attunement?: true | string;
  /** The line under its name, as the SRD prints it: "Wondrous item, uncommon (requires attunement)". */
  heading: string;
  description: string;
}

export interface InventoryEntry {
  /** Explicit material override for unusual equipment (DAG-119). */
  ferrous?: boolean;
  /** Eaten by a rust monster or a gray ooze (DAG-119): -1 to the AC it gives or the damage it deals, each. */
  corroded?: number;
  itemId: string;
  quantity: number;
  equipped?: boolean;
  /** Uses spent from the one in hand, for gear with several (a healer's kit's ten, DAG-166). */
  used?: number;
  /** Pact of the Blade (DAG-189): the warlock's pact weapon, magical and theirs to wield. */
  pact?: true;
}

export type SpellcastingAbility = Extract<Ability, "int" | "wis" | "cha">;
