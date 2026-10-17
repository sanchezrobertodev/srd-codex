import type { Ability, AbilityScores, Condition, Skill } from "./abilities";
import type { InventoryEntry, SpellcastingAbility } from "./items";
import type { Cell } from "./battlefield";

export type SpellSlots = Record<number, { max: number; used: number }>;

/**
 * A spell choice earned on levelling up by a caster who knows its spells (DAG-57): choosing another
 * spell in place of one learned for the player (`spellId`), or the one replacement of any known
 * spell that each level after the first allows. Either way the new spell can be at most `maxLevel`,
 * the highest slot level at the level that earned it.
 */
export interface SpellChoice {
  maxLevel: number;
  spellId?: string;
}

export interface CharacterSpellcasting {
  ability: SpellcastingAbility;
  slots: SpellSlots;
  cantrips: string[];
  /** Spellbook (wizard) or full class list (cleric) */
  known: string[];
  /** Spells available to cast today; for a caster who knows its spells, all of them. */
  prepared: string[];
  concentratingOn?: string;
  /** Pact Magic (DAG-57): the slots come back on a short rest. */
  pact?: boolean;
  /** A caster who knows its spells: choices earned on levelling up, still to make (DAG-57). */
  spellChoices?: SpellChoice[];
}

export interface Character {
  id: string;
  name: string;
  raceId: string;
  classId: string;
  level: number;
  xp: number;
  background: string;
  alignment: string;
  abilities: AbilityScores;
  maxHp: number;
  hp: number;
  tempHp: number;
  hitDice: { die: number; total: number; used: number };
  speed: number;
  proficiencies: {
    saves: Ability[];
    skills: Skill[];
    armor: string[];
    weapons: string[];
    tools: string[];
  };
  featureIds: string[];
  /** Per-feature resource usage keyed by feature id, e.g. second-wind */
  featureUses: Record<string, { max: number; used: number }>;
  inventory: InventoryEntry[];
  /** Starting coins before joining a game; in play, GameState.gold owns the purse (DAG-110). */
  gold: number;
  conditions: Condition[];
  /** Grid position while a battlefield is staged (tactical combat only) */
  pos?: Cell;
  deathSaves: { successes: number; failures: number };
  /** At 0 HP and stable (three death-save successes): no more death saves until hurt again (DAG-106). */
  stable?: true;
  /** Set when death saves reach three failures or massive damage kills outright. Nothing can act on a dead character. */
  dead: boolean;
  /** Death's game minute; absent on old saves (DAG-112). */
  diedAt?: number;
  /** Fight rounds passed since death, which the clock doesn't count (DAG-189: Revivify's minute). */
  roundsDead?: number;
  /** Raise Dead's penalty, reduced by one per long rest (DAG-112). */
  revivalPenalty?: number;
  spellcasting?: CharacterSpellcasting;
  notes: string;
  // Level-1 choices (DAG-45). Optional, so characters saved before them still load.
  /** Languages spoken. */
  languages?: string[];
  /** Rogue Expertise: skills (or "thieves-tools") whose proficiency bonus is doubled. */
  expertise?: string[];
  /** Fighter: the fighting style's id. */
  fightingStyle?: string;
  /** Ranger Favored Enemy (DAG-63): one creature type, or two humanoid races (keys of FAVORED_HUMANOIDS). */
  favoredEnemies?: string[];
  /** Ranger Natural Explorer (DAG-63): the favored terrain. */
  favoredTerrain?: string;
  /** Sorcerer, Draconic Bloodline (DAG-64): the dragon ancestor (a key of DRAGON_ANCESTORS). */
  dragonAncestor?: string;
  /** Dragonborn (DAG-66): the Draconic Ancestry (a key of DRAGON_ANCESTORS), which sets the breath weapon and a resistance. */
  draconicAncestry?: string;
  /** Warlock (DAG-65): the otherworldly patron ("fiend", the only one in SRD 5.1). */
  patron?: string;
  /** Cleric: the divine domain's id ("life", the only one in SRD 5.1). */
  domain?: string;
  /**
   * Spells from the race, cast with their own ability: the High Elf's wizard cantrip uses
   * Intelligence. One with a `slotLevel` (the Tiefling's Hellish Rebuke, DAG-66) is cast at that
   * level once per long rest without a spell slot; its uses are featureUses["racial-spell:<id>"].
   */
  racialSpells?: { spellId: string; ability: Ability; slotLevel?: number }[];
  /** Who the hero is, in words the DM brings into the story (DAG-52). Optional, so older saves load as they are. */
  persona?: Persona;
  /** The hero's portrait (DAG-54). Optional: without one, the default crest for the race and class. */
  portrait?: Portrait;
  /**
   * Barbarian Rage (DAG-58), while it lasts: rounds left of its minute, and whether the barbarian
   * attacked a hostile creature or took damage since their last turn (or it ends with this one).
   */
  rage?: { roundsLeft: number; sustained: boolean; /** Frenzy (Path of the Berserker, DAG-189): the round it began; a bonus attack each turn after, exhaustion when it ends. */ frenzy?: number };
  /** Stunning Strike (DAG-189): armed on the hotbar for the monk's next melee weapon hit. */
  stunningArmed?: true;
  /** Divine Smite (DAG-190): armed for the paladin's next melee weapon hit, with a spell slot of this level. */
  smiteArmed?: number;
  /**
   * Wild Shape (DAG-190), while the druid is a beast: which, its hit points, the rounds left of its hours,
   * and the druid's own Strength, Dexterity and Constitution, given back when it ends.
   */
  wildShape?: { monsterId: string; hp: number; maxHp: number; roundsLeft: number; scores: { str: number; dex: number; con: number } };
  /** Metamagic (DAG-189): the option armed on the hotbar for the sorcerer's next spell. */
  metamagicArmed?: string;
  /** Sacred Weapon (Oath of Devotion, DAG-189): the weapon hallowed, and the rounds left of its minute. */
  sacredWeapon?: { weaponId: string; roundsLeft: number };
  /** Exhaustion level 1-6 (SRD 5.1, DAG-30); absent at 0. */
  exhaustion?: number;
  /** A Bardic Inspiration die from a bard of the party (DAG-105): the die, until a game time in minutes, and the bard. */
  inspiration?: { die: number; expiresAt: number; from: string };
  /** The Help action on this hero's next check of a skill or ability (DAG-106): advantage, from the hero who helped. */
  helped?: { by: string; skill: string };
  /** Ate since the last long rest (DAG-166): a long rest lowers exhaustion only for a hero who has eaten. */
  fed?: true;
  /**
   * Hit-point maximum taken by monsters (DAG-119): a specter's Life Drain until a long rest, a
   * disease until it is cured. `maxHp` is already lowered by these; they give it back.
   */
  hpDrains?: { source: string; amount: number; until: "long-rest" | "cure" }[];
  /** Ability scores taken by monsters (DAG-119): a shadow's Strength Drain until a short or long rest. */
  abilityDrains?: { source: string; ability: Ability; amount: number }[];
  /** Poisoned until this game minute (DAG-167, a chest's poison needle): the condition then ends. */
  poisonedUntil?: number;
  /**
   * The subclass chosen on levelling up (DAG-183): "berserker", "champion", "evocation". The Cleric's
   * domain, the Sorcerer's dragon ancestor and the Warlock's patron stay where level 1 put them.
   */
  subclass?: string;
  /** Choices made on gaining levels (DAG-183) that have no other home on the sheet. */
  advancement?: Advancement;
}

/** An Ability Score Improvement (two points, at most 20 each) or a feat, taken at 4th, 8th... level (DAG-183). */
export type Improvement = { level: number; increases: Partial<Record<Ability, number>> } | { level: number; feat: string };

/** What a hero chose on levelling up (DAG-183), beyond hit points, spells and the fields of their own. */
export interface Advancement {
  /** Ability Score Improvements and feats, in the order taken. */
  improvements?: Improvement[];
  /** Sorcerer Metamagic options. */
  metamagic?: string[];
  /** Warlock Eldritch Invocations. */
  invocations?: string[];
  /** Book of Ancient Secrets (DAG-189): the ritual spells written in the Book of Shadows. */
  tomeRituals?: string[];
  /** Warlock Pact Boon: "chain", "blade" or "tome". */
  pactBoon?: string;
  /** Cantrips from outside the class's list, by id: the Pact of the Tome's, the Circle of the Land's bonus one. */
  bonusCantrips?: string[];
  /** Hunter's Prey. */
  huntersPrey?: string;
  /** Circle of the Land: the land whose circle spells the druid gains. */
  circleTerrain?: string;
  /** College of Lore: the three skills of Bonus Proficiencies. */
  loreSkills?: string[];
  /** Ranger Natural Explorer: the terrains favored after the first (favoredTerrain). */
  favoredTerrains?: string[];
  /** Bard Magical Secrets: spells from any class, counted among the spells known. */
  magicalSecrets?: string[];
  /** College of Lore's Additional Magical Secrets (6th level): two spells from any class, not counted among the spells known. */
  loreSecrets?: string[];
  /** Warlock Mystic Arcanum: one spell each of 6th to 9th level. */
  mysticArcanum?: string[];
  /** Wizard Spell Mastery (a 1st- and a 2nd-level spell) and Signature Spells (two of 3rd level). */
  spellMastery?: string[];
  signatureSpells?: string[];
}

/** Personality and backstory: all optional, all free text, no game numbers. */
export interface Persona {
  pronouns?: string;
  appearance?: string;
  trait?: string;
  ideal?: string;
  bond?: string;
  flaw?: string;
  backstory?: string;
}

export const PERSONA_FIELDS = ["pronouns", "appearance", "trait", "ideal", "bond", "flaw", "backstory"] as const;
export type PersonaField = (typeof PERSONA_FIELDS)[number];

/** The longest each field may be, in characters. */
export const PERSONA_LIMITS: Record<PersonaField, number> = { pronouns: 30, appearance: 240, trait: 240, ideal: 240, bond: 240, flaw: 240, backstory: 1200 };

/**
 * A portrait (DAG-54): a crest drawn by code from the race's colours and the class's emblem, in
 * one of the shield designs; an image the player chose, kept as a small data URL with the save; or
 * one of the game's painted portraits (DAG-74), by its id in the art manifest ("dwarf-female-1").
 * The crest stores only its design, so it follows the race and class when they change.
 */
export type Portrait = { kind: "crest"; field: CrestField } | { kind: "image"; src: string } | { kind: "art"; id: string };

/** How the crest's shield is divided between the race's two colours. */
export const CREST_FIELDS = ["per-bend", "per-pale", "quarterly", "chevron", "plain"] as const;
export type CrestField = (typeof CREST_FIELDS)[number];

/** The crest a character has until the player picks another. */
export const DEFAULT_PORTRAIT: Portrait = { kind: "crest", field: "per-bend" };

/** The longest an image portrait's data URL may be, in characters (about 110 KB of image). */
export const PORTRAIT_IMAGE_LIMIT = 150_000;

/** Raster images only, base64-encoded: nothing that could carry a script or a link elsewhere. */
const PORTRAIT_IMAGE = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

/** Whether a value is a portrait this game can show safely: from a save, a draft or an import. */
export function isPortrait(p: unknown): p is Portrait {
  if (typeof p !== "object" || p === null) return false;
  const v = p as Record<string, unknown>;
  if (v.kind === "crest") return (CREST_FIELDS as readonly unknown[]).includes(v.field);
  if (v.kind === "image") return typeof v.src === "string" && v.src.length <= PORTRAIT_IMAGE_LIMIT && PORTRAIT_IMAGE.test(v.src);
  // An id, not a path: the app looks it up in its own manifest, and shows the crest if it's gone.
  if (v.kind === "art") return typeof v.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.id) && v.id.length <= 64;
  return false;
}
