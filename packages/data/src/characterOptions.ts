// Level-1 choices from SRD 5.1 that the class and race data don't spell out (DAG-45): languages,
// fighting styles, the dwarf's tool choice and the Life Domain's spells.

/** SRD 5.1 "Languages": the standard languages, then the exotic ones. */
export const STANDARD_LANGUAGES = ["Common", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc"] as const;
export const EXOTIC_LANGUAGES = ["Abyssal", "Celestial", "Draconic", "Deep Speech", "Infernal", "Primordial", "Sylvan", "Undercommon"] as const;
export const LANGUAGES: readonly string[] = [...STANDARD_LANGUAGES, ...EXOTIC_LANGUAGES];

/** Extra languages of the player's choice that a race grants (SRD 5.1: Human, High Elf and Half-Elf, one each). */
export const RACE_EXTRA_LANGUAGES: Record<string, number> = { human: 1, elf: 1, "half-elf": 1 };

/**
 * Ability score increases a race lets the player place (SRD 5.1, DAG-66): the Half-Elf's +1 to two
 * abilities other than Charisma, on top of its fixed +2 Charisma.
 */
export const RACE_ABILITY_CHOICES: Record<string, { count: number; exclude: readonly string[] }> = { "half-elf": { count: 2, exclude: ["cha"] } };

/** Skills of the player's choice a race grants (SRD 5.1, DAG-66): the Half-Elf's Skill Versatility, two of any. */
export const RACE_SKILL_CHOICES: Record<string, number> = { "half-elf": 2 };

/** Tool proficiencies a race always has (SRD 5.1, DAG-66): the Rock Gnome's Tinker gives tinker's tools. */
export const RACE_TOOLS: Record<string, readonly string[]> = { gnome: ["tinkers-tools"] };

/**
 * Cantrips a race always knows, with the ability it casts them with (SRD 5.1, DAG-66): the
 * Tiefling's Infernal Legacy gives thaumaturgy, cast with Charisma.
 */
export const RACE_CANTRIPS: Record<string, readonly { spellId: string; ability: "int" | "wis" | "cha" }[]> = { tiefling: [{ spellId: "thaumaturgy", ability: "cha" }] };

/**
 * Spells a race gains at a character level, each cast once per long rest at `slotLevel` without a
 * spell slot (SRD 5.1, DAG-66 review): the Tiefling's Infernal Legacy gives Hellish Rebuke as a
 * 2nd-level spell at 3rd level and Darkness at 5th, cast with Charisma.
 */
export const RACE_LEVEL_SPELLS: Record<string, readonly { level: number; spellId: string; slotLevel: number; ability: "int" | "wis" | "cha" }[]> = {
  tiefling: [
    { level: 3, spellId: "hellish-rebuke", slotLevel: 2, ability: "cha" },
    { level: 5, spellId: "darkness", slotLevel: 2, ability: "cha" },
  ],
};

/** The tools a hill dwarf may pick for Tool Proficiency (SRD 5.1), as item ids. */
export const DWARF_TOOL_CHOICES = ["smiths-tools", "brewers-supplies", "masons-tools"] as const;

export interface FightingStyle {
  id: string;
  name: string;
  description: string;
  /** Why the style can't be taken in this game yet, if it can't. */
  unavailable?: string;
}

/** SRD 5.1 fighter fighting styles. */
export const FIGHTING_STYLES: FightingStyle[] = [
  { id: "archery", name: "Archery", description: "You gain a +2 bonus to attack rolls you make with ranged weapons." },
  { id: "defense", name: "Defense", description: "While you are wearing armor, you gain a +1 bonus to AC." },
  { id: "dueling", name: "Dueling", description: "When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon." },
  {
    id: "great-weapon-fighting",
    name: "Great Weapon Fighting",
    description: "When you roll a 1 or 2 on a damage die for an attack you make with a melee weapon that you are wielding with two hands, you can reroll the die and must use the new roll. The weapon must have the two-handed or versatile property.",
  },
  {
    id: "protection",
    name: "Protection",
    description: "When a creature you can see attacks a target other than you that is within 5 feet of you, you can use your reaction to impose disadvantage on the attack roll. You must be wielding a shield.",
  },
  {
    id: "two-weapon-fighting",
    name: "Two-Weapon Fighting",
    description: "When you engage in two-weapon fighting, you can add your ability modifier to the damage of the second attack.",
  },
];

/** The divine domains in SRD 5.1 (only Life), with their 1st-level domain spells, always prepared. */
export const DIVINE_DOMAINS: { id: string; name: string; spells: string[] }[] = [{ id: "life", name: "Life Domain", spells: ["bless", "cure-wounds"] }];

/**
 * SRD 5.2.1 (CC-BY-4.0), "Standard Array by Class": where the standard array goes for each class,
 * highest scores in its main abilities. The creator's recommended placement (DAG-48); SRD 5.1 has
 * no ability-score methods for characters, so they come from 5.2.1 (DAG-43).
 */
export const STANDARD_ARRAY_BY_CLASS: Record<string, { str: number; dex: number; con: number; int: number; wis: number; cha: number }> = {
  barbarian: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
  bard: { str: 8, dex: 14, con: 12, int: 13, wis: 10, cha: 15 },
  cleric: { str: 14, dex: 8, con: 13, int: 10, wis: 15, cha: 12 },
  druid: { str: 8, dex: 12, con: 14, int: 13, wis: 15, cha: 10 },
  fighter: { str: 15, dex: 14, con: 13, int: 8, wis: 10, cha: 12 },
  monk: { str: 12, dex: 15, con: 13, int: 10, wis: 14, cha: 8 },
  paladin: { str: 15, dex: 10, con: 13, int: 8, wis: 12, cha: 14 },
  ranger: { str: 12, dex: 15, con: 13, int: 8, wis: 14, cha: 10 },
  rogue: { str: 12, dex: 15, con: 13, int: 14, wis: 10, cha: 8 },
  sorcerer: { str: 10, dex: 13, con: 14, int: 8, wis: 12, cha: 15 },
  warlock: { str: 8, dex: 14, con: 13, int: 12, wis: 10, cha: 15 },
  wizard: { str: 8, dex: 12, con: 13, int: 15, wis: 14, cha: 10 },
};

/**
 * The tools a character can be proficient in (SRD 5.1 "Tools": artisan's tools, gaming sets,
 * musical instruments and kits), as item ids. A background's duplicate tool is swapped for one
 * of these (DAG-50).
 */
export const TOOL_PROFICIENCIES: readonly string[] = [
  "alchemists-supplies", "brewers-supplies", "calligraphers-supplies", "carpenters-tools", "cartographers-tools", "cobblers-tools", "glassblowers-tools",
  "jewelers-tools", "leatherworkers-tools", "masons-tools", "painters-supplies", "potters-tools", "smiths-tools", "tinkers-tools", "weavers-tools",
  "woodcarvers-tools", "dice-set", "playing-card-set", "bagpipes", "drum", "dulcimer", "flute", "lute", "lyre", "horn", "pan-flute", "shawm", "viol",
  "disguise-kit", "forgery-kit", "herbalism-kit", "navigators-tools", "poisoners-kit", "thieves-tools",
];

/** The nine alignments, as the builder offers them. */
export const ALIGNMENTS = ["Lawful Good", "Neutral Good", "Chaotic Good", "Lawful Neutral", "Neutral", "Chaotic Neutral", "Lawful Evil", "Neutral Evil", "Chaotic Evil"] as const;

/** SRD 5.1 artisan's tools and musical instruments, as tool proficiencies. */
export const ARTISANS_TOOLS: readonly string[] = TOOL_PROFICIENCIES.slice(0, TOOL_PROFICIENCIES.indexOf("woodcarvers-tools") + 1);
export const MUSICAL_INSTRUMENTS: readonly string[] = ["bagpipes", "drum", "dulcimer", "flute", "lute", "lyre", "horn", "pan-flute", "shawm", "viol"];

// SRD 5.1 Ranger (DAG-63).

/** Natural Explorer: the terrains a ranger can favor. */
export const FAVORED_TERRAINS = ["arctic", "coast", "desert", "forest", "grassland", "mountain", "swamp", "underdark"] as const;

/**
 * Favored Enemy: the creature types a ranger can choose. The languages they speak come from the SRD
 * monsters of each type (favoredEnemySpeaks).
 */
export const FAVORED_ENEMY_TYPES: Record<string, { name: string }> = {
  aberration: { name: "Aberrations" },
  beast: { name: "Beasts" },
  celestial: { name: "Celestials" },
  construct: { name: "Constructs" },
  dragon: { name: "Dragons" },
  elemental: { name: "Elementals" },
  fey: { name: "Fey" },
  fiend: { name: "Fiends" },
  giant: { name: "Giants" },
  monstrosity: { name: "Monstrosities" },
  ooze: { name: "Oozes" },
  plant: { name: "Plants" },
  undead: { name: "Undead" },
};

/**
 * Or two humanoid races: the peoples of the SRD, with the monsters that belong to each (for matching
 * a creature in the scene) and the languages the race speaks besides its monsters' own.
 */
export const FAVORED_HUMANOIDS: Record<string, { name: string; monsters: string[]; languages: string[] }> = {
  "deep-gnomes": { name: "Deep gnomes", monsters: ["deep-gnome-svirfneblin"], languages: [] },
  dragonborn: { name: "Dragonborn", monsters: [], languages: ["Draconic"] },
  drow: { name: "Drow", monsters: ["drow"], languages: [] },
  duergar: { name: "Duergar", monsters: ["duergar"], languages: [] },
  dwarves: { name: "Dwarves", monsters: ["duergar"], languages: ["Dwarvish"] },
  elves: { name: "Elves", monsters: ["drow"], languages: ["Elvish"] },
  gnolls: { name: "Gnolls", monsters: ["gnoll"], languages: [] },
  gnomes: { name: "Gnomes", monsters: ["deep-gnome-svirfneblin"], languages: ["Gnomish"] },
  goblinoids: { name: "Goblinoids", monsters: ["goblin", "hobgoblin", "bugbear"], languages: [] },
  grimlocks: { name: "Grimlocks", monsters: ["grimlock"], languages: [] },
  "half-elves": { name: "Half-elves", monsters: [], languages: ["Elvish"] },
  "half-orcs": { name: "Half-orcs", monsters: [], languages: ["Orc"] },
  halflings: { name: "Halflings", monsters: [], languages: ["Halfling"] },
  humans: { name: "Humans", monsters: [], languages: [] },
  kobolds: { name: "Kobolds", monsters: ["kobold"], languages: [] },
  lizardfolk: { name: "Lizardfolk", monsters: ["lizardfolk"], languages: [] },
  merfolk: { name: "Merfolk", monsters: ["merfolk"], languages: [] },
  orcs: { name: "Orcs", monsters: ["orc"], languages: [] },
  sahuagin: { name: "Sahuagin", monsters: ["sahuagin"], languages: [] },
  tieflings: { name: "Tieflings", monsters: [], languages: ["Infernal"] },
};

/** A favored enemy's name: "Undead", "Goblinoids". */
export const favoredEnemyName = (id: string): string => FAVORED_ENEMY_TYPES[id]?.name ?? FAVORED_HUMANOIDS[id]?.name ?? id;
/** A favored terrain's name: "Forest", "Underdark". */
export const favoredTerrainName = (id: string): string => id.charAt(0).toUpperCase() + id.slice(1);

/**
 * The dragon types (SRD 5.1): a draconic sorcerer's ancestor (DAG-64) and a dragonborn's Draconic
 * Ancestry (DAG-66). Each sets a damage type; for a dragonborn it also sets the breath weapon's
 * shape (a 15-ft cone or a 5-by-30-ft line) and the saving throw against it.
 */
export const DRAGON_ANCESTORS: Record<string, { name: string; damageType: string; breath: "cone" | "line"; save: "dex" | "con" }> = {
  black: { name: "Black", damageType: "acid", breath: "line", save: "dex" },
  blue: { name: "Blue", damageType: "lightning", breath: "line", save: "dex" },
  brass: { name: "Brass", damageType: "fire", breath: "line", save: "dex" },
  bronze: { name: "Bronze", damageType: "lightning", breath: "line", save: "dex" },
  copper: { name: "Copper", damageType: "acid", breath: "line", save: "dex" },
  gold: { name: "Gold", damageType: "fire", breath: "cone", save: "dex" },
  green: { name: "Green", damageType: "poison", breath: "cone", save: "con" },
  red: { name: "Red", damageType: "fire", breath: "cone", save: "dex" },
  silver: { name: "Silver", damageType: "cold", breath: "cone", save: "con" },
  white: { name: "White", damageType: "cold", breath: "cone", save: "con" },
};

/** Musical instruments a class is proficient with, of the player's choice (DAG-59): the Bard's three. */
export const CLASS_INSTRUMENTS: Record<string, number> = { bard: 3 };

/** A tool proficiency the class lets the player choose (DAG-61): the Monk's artisan's tool or instrument. */
export const CLASS_TOOL_CHOICES: Record<string, readonly string[]> = {
  monk: [...ARTISANS_TOOLS, ...MUSICAL_INSTRUMENTS],
};
