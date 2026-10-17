import type { Ability, Skill } from "./abilities";
import type { SpellcastingAbility } from "./items";

export interface ClassFeature {
  id: string;
  name: string;
  level: number;
  description: string;
}

/** slots[characterLevel][spellLevel] = number of slots */
export type SpellSlotTable = Record<number, Record<number, number>>;

export interface ClassData {
  id: string;
  name: string;
  hitDie: number;
  primaryAbilities: Ability[];
  savingThrows: Ability[];
  skillChoices: { count: number; from: Skill[] };
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  startingEquipment: { itemId: string; quantity: number }[];
  features: ClassFeature[];
  spellcasting?: {
    ability: SpellcastingAbility;
    /**
     * "prepared" = cleric style (prepares from the whole list), "spellbook" = wizard style, "known" =
     * a set number of spells always ready (Bard, Ranger, Sorcerer, Warlock; DAG-57).
     */
    type: "prepared" | "spellbook" | "known";
    cantripsKnown: Record<number, number>;
    slots: SpellSlotTable;
    /** Spells known by class level, for a "known" caster. */
    spellsKnown?: Record<number, number>;
    /** Pact Magic (the Warlock): every slot is of one level, and they all come back on a short rest. */
    pact?: boolean;
  };
  /**
   * The class table's own columns, by class level, as the SRD prints them (DAG-84): the
   * Barbarian's Rages and Rage Damage, the Monk's Martial Arts, the Rogue's Sneak Attack…
   * For the Codex; the engine doesn't read them.
   */
  columns?: { label: string; values: Record<number, string> }[];
}

export interface RaceData {
  id: string;
  name: string;
  speed: number;
  size: "small" | "medium";
  abilityBonuses: Partial<Record<Ability, number>>;
  languages: string[];
  traits: { id: string; name: string; description: string }[];
  darkvision?: number;
  /**
   * The SRD subrace merged into this race (DAG-84): the race's own name ("Dwarf"), and what the
   * subrace ("Hill Dwarf") adds, so the Codex can show them apart. `name` stays the subrace's.
   */
  subrace?: { id: string; name: string; baseName: string; abilityBonuses: Partial<Record<Ability, number>>; traitIds: string[] };
}

/**
 * A background in the SRD 5.1 shape: two skills, two tools or languages in total, equipment, some
 * gold and a feature. Content is either the SRD's own (only Acolyte) or written for this game
 * (DAG-43), never from other books.
 */
export interface BackgroundData {
  id: string;
  name: string;
  source: "srd-5.1" | "original";
  /** One or two sentences: who this character was before adventuring. */
  summary: string;
  skills: Skill[];
  /** Extra languages of the player's choice. */
  languages: number;
  /** Tool proficiencies, as item ids. */
  tools: string[];
  equipment: { itemId: string; quantity: number }[];
  gold: number;
  feature: { name: string; description: string };
  /** Suggested personality traits, ideals, bonds and flaws, when the source has them. */
  characteristics?: { traits: string[]; ideals: string[]; bonds: string[]; flaws: string[] };
}
