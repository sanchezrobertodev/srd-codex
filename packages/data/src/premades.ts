// Ready-made heroes for Quick start (DAG-47): two for each playable class, every choice already
// made, so a new player can be in the story in one click. Names and stories are original. Six of
// them (Brakk, Vesper, Elowen, Tomas, Kaija and Sela) are also the dev session's characters. Each
// race added in DAG-66 has one: Brenna (Dragonborn), Corvin (Gnome), Ilyana (Half-Elf), Dorn
// (Half-Orc) and Sable (Tiefling). Each has their own painted portrait (DAG-113); twelve are women
// and twelve men, as their stories say where they do.

import type { CrestField, Skill } from "@dnd/shared";
import type { Complexity } from "./creatorGuide";

export interface PremadeHero {
  id: string;
  /** Recorded for the portrait (DAG-113): set by the story where it says, otherwise chosen to keep 12 of each. */
  sex: "female" | "male";
  /** The hero's own painted portrait in @dnd/assets (kind "portrait"); the crest stands in without it. */
  portraitArt?: string;
  name: string;
  /** One line of story for the card. */
  pitch: string;
  difficulty: Complexity;
  raceId: string;
  classId: string;
  /** Base scores before racial bonuses: the standard array, placed for this hero. */
  scores: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  skills: Skill[];
  background: string;
  alignment: string;
  cantrips?: string[];
  spells?: string[];
  prepared?: string[];
  languages?: string[];
  tool?: string;
  racialCantrip?: string;
  fightingStyle?: string;
  expertise?: string[];
  /** The background's languages of the player's choice (DAG-50). */
  backgroundLanguages?: string[];
  /** A background skill or tool the hero already has, and the one taken in its place. */
  backgroundSwaps?: Record<string, string>;
  /** The tool or instrument the class lets the hero choose (the Monk's, DAG-61). */
  classTool?: string;
  /** Ranger (DAG-63): favored enemies, the language learned from them, and the favored terrain. */
  favoredEnemies?: string[];
  favoredEnemyLanguage?: string;
  favoredTerrain?: string;
  /** Sorcerer (DAG-64): the dragon ancestor. */
  dragonAncestor?: string;
  /** Bard (DAG-59): the three musical instruments. */
  instruments?: string[];
  /** Half-Elf (DAG-66): the two abilities that get +1, and the two Skill Versatility skills. */
  raceAbilities?: string[];
  versatileSkills?: Skill[];
  /** Dragonborn (DAG-66): the Draconic Ancestry. */
  draconicAncestry?: string;
  /** Starting kit choices (DAG-51): choice id to option id, and the items named for picks. */
  kit: { choices: Record<string, string>; picks?: Record<string, string[]> };
  /** The crest's shield design (DAG-54); without it, the default. */
  crest?: CrestField;
}

export const PREMADE_HEROES: PremadeHero[] = [
  {
    id: "brakk",
    sex: "male",
    portraitArt: "premade-brakk",
    crest: "per-pale",
    name: "Brakk",
    pitch: "A militia sergeant who held the river ford for three days and now wants to see what lies past it.",
    difficulty: "first-pick",
    raceId: "human",
    classId: "fighter",
    scores: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
    skills: ["athletics", "perception"],
    background: "Militia Veteran",
    alignment: "Lawful Good",
    languages: ["Dwarvish"],
    fightingStyle: "archery",
    backgroundLanguages: ["Orc"],
    backgroundSwaps: { athletics: "survival" },
    kit: {
      choices: { "fighter-armor": "chain-mail", "fighter-weapons": "martial-shield", "fighter-ranged": "handaxes", "fighter-pack": "explorers" },
      picks: { "fighter-weapons/martial-shield": ["longsword"] },
    },
  },
  {
    id: "hrolda",
    sex: "female",
    portraitArt: "premade-hrolda",
    crest: "chevron",
    name: "Hrolda Stonejaw",
    pitch: "A caravan guard who has walked every trade road and carried every wound home.",
    difficulty: "first-pick",
    raceId: "dwarf",
    classId: "fighter",
    scores: { str: 15, dex: 10, con: 14, int: 8, wis: 13, cha: 12 },
    skills: ["intimidation", "survival"],
    background: "Caravan Guard",
    alignment: "Neutral Good",
    tool: "smiths-tools",
    fightingStyle: "defense",
    backgroundLanguages: ["Giant"],
    kit: {
      choices: { "fighter-armor": "chain-mail", "fighter-weapons": "martial-shield", "fighter-ranged": "crossbow", "fighter-pack": "dungeoneers" },
      picks: { "fighter-weapons/martial-shield": ["warhammer"] },
    },
  },
  {
    id: "vesper",
    sex: "male",
    portraitArt: "premade-vesper",
    crest: "per-bend",
    name: "Vesper",
    pitch: "A message runner from the lower city who knows every rooftop and most of the locks.",
    difficulty: "first-pick",
    raceId: "halfling",
    classId: "rogue",
    scores: { str: 8, dex: 15, con: 13, int: 12, wis: 10, cha: 14 },
    skills: ["stealth", "acrobatics", "perception", "deception"],
    background: "Street Runner",
    alignment: "Chaotic Good",
    expertise: ["deception", "thieves-tools"],
    backgroundSwaps: { stealth: "insight", "thieves-tools": "disguise-kit" },
    kit: { choices: { "rogue-weapon": "rapier", "rogue-ranged": "shortbow", "rogue-pack": "burglars" } },
  },
  {
    id: "isolde",
    sex: "female",
    portraitArt: "premade-isolde",
    crest: "quarterly",
    name: "Isolde Varr",
    pitch: "A disinherited heir who traded a title for a set of picks and a long memory.",
    difficulty: "some-choices",
    raceId: "elf",
    classId: "rogue",
    scores: { str: 10, dex: 15, con: 13, int: 14, wis: 12, cha: 8 },
    skills: ["investigation", "insight", "persuasion", "sleight-of-hand"],
    background: "Exiled Heir",
    alignment: "Chaotic Neutral",
    languages: ["Draconic"],
    racialCantrip: "minor-illusion",
    expertise: ["investigation", "perception"],
    backgroundLanguages: ["Infernal"],
    backgroundSwaps: { persuasion: "deception" },
    kit: { choices: { "rogue-weapon": "shortsword", "rogue-ranged": "shortbow", "rogue-pack": "explorers" } },
  },
  {
    id: "elowen",
    sex: "female",
    portraitArt: "premade-elowen",
    crest: "per-bend",
    name: "Elowen",
    pitch: "A self-taught mage who learned from borrowed books and means to write one worth borrowing.",
    difficulty: "many-options",
    raceId: "elf",
    classId: "wizard",
    scores: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 },
    skills: ["arcana", "investigation"],
    background: "Hedge Scholar",
    alignment: "Neutral Good",
    cantrips: ["fire-bolt", "mage-hand", "light"],
    spells: ["magic-missile", "shield", "burning-hands", "sleep", "mage-armor", "detect-magic"],
    prepared: ["magic-missile", "shield", "burning-hands", "sleep"],
    languages: ["Draconic"],
    racialCantrip: "prestidigitation",
    backgroundLanguages: ["Sylvan", "Celestial"],
    backgroundSwaps: { arcana: "nature" },
    kit: { choices: { "wizard-weapon": "quarterstaff", "wizard-focus": "component-pouch", "wizard-pack": "scholars" } },
  },
  {
    id: "corvin",
    sex: "male",
    portraitArt: "premade-corvin",
    crest: "plain",
    name: "Corvin Ashgrove",
    pitch: "A temple archivist who found a spellbook shelved under the wrong god.",
    difficulty: "many-options",
    raceId: "gnome",
    classId: "wizard",
    scores: { str: 8, dex: 12, con: 13, int: 15, wis: 14, cha: 10 },
    skills: ["arcana", "history"],
    background: "Acolyte",
    alignment: "Lawful Neutral",
    cantrips: ["ray-of-frost", "mage-hand", "minor-illusion"],
    spells: ["magic-missile", "shield", "mage-armor", "sleep", "thunderwave", "find-familiar"],
    prepared: ["mage-armor", "magic-missile", "shield", "sleep"],
    backgroundLanguages: ["Celestial", "Draconic"],
    kit: { choices: { "wizard-weapon": "dagger", "wizard-focus": "arcane-focus", "wizard-pack": "scholars" }, picks: { "wizard-focus/arcane-focus": ["orb"] } },
  },
  {
    id: "tomas",
    sex: "male",
    portraitArt: "premade-tomas",
    crest: "chevron",
    name: "Tomas",
    pitch: "A dwarven priest of the forge, as quick with a blessing as with a hammer.",
    difficulty: "some-choices",
    raceId: "dwarf",
    classId: "cleric",
    scores: { str: 14, dex: 8, con: 13, int: 10, wis: 15, cha: 12 },
    skills: ["medicine", "religion"],
    background: "Acolyte",
    alignment: "Lawful Good",
    cantrips: ["sacred-flame", "guidance", "light"],
    spells: ["guiding-bolt", "healing-word"],
    tool: "smiths-tools",
    backgroundLanguages: ["Celestial", "Giant"],
    backgroundSwaps: { religion: "history" },
    kit: { choices: { "cleric-weapon": "mace", "cleric-armor": "scale-mail", "cleric-ranged": "crossbow", "cleric-pack": "priests" } },
  },
  {
    id: "maren",
    sex: "female",
    portraitArt: "premade-maren",
    crest: "quarterly",
    name: "Maren Holloway",
    pitch: "A village healer who heard a god answer once and has been listening ever since.",
    difficulty: "some-choices",
    raceId: "human",
    classId: "cleric",
    scores: { str: 12, dex: 10, con: 14, int: 8, wis: 15, cha: 13 },
    skills: ["insight", "persuasion"],
    background: "Village Herbalist",
    alignment: "Neutral Good",
    cantrips: ["sacred-flame", "spare-the-dying", "thaumaturgy"],
    spells: ["healing-word", "sanctuary", "shield-of-faith", "command"],
    languages: ["Halfling"],
    backgroundLanguages: ["Elvish"],
    kit: {
      choices: { "cleric-weapon": "mace", "cleric-armor": "scale-mail", "cleric-ranged": "simple", "cleric-pack": "explorers" },
      picks: { "cleric-ranged/simple": ["spear"] },
    },
  },
  // Barbarians (DAG-58).
  {
    id: "kaija",
    sex: "female",
    portraitArt: "premade-kaija",
    crest: "chevron",
    name: "Kaija Stormhand",
    pitch: "A trail guide from the high passes who learned to answer a blizzard by shouting back at it.",
    difficulty: "first-pick",
    raceId: "human",
    classId: "barbarian",
    scores: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
    skills: ["athletics", "perception"],
    background: "Frontier Scout",
    alignment: "Chaotic Good",
    languages: ["Giant"],
    backgroundLanguages: ["Orc"],
    kit: { choices: { "barbarian-weapon": "greataxe", "barbarian-second": "handaxes" } },
  },
  {
    id: "dorn",
    sex: "male",
    portraitArt: "premade-dorn",
    crest: "quarterly",
    name: "Dorn Ashbeard",
    pitch: "A caravan guard who carried the strongbox on his back when the mule fell, and hasn't stopped carrying things since.",
    difficulty: "some-choices",
    raceId: "half-orc",
    classId: "barbarian",
    scores: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
    skills: ["athletics", "survival"],
    background: "Caravan Guard",
    alignment: "Neutral Good",
    backgroundLanguages: ["Giant"],
    kit: { choices: { "barbarian-weapon": "martial-melee", "barbarian-second": "handaxes" }, picks: { "barbarian-weapon/martial-melee": ["battleaxe"] } },
  },
  // Monks (DAG-61).
  {
    id: "sela",
    sex: "female",
    portraitArt: "premade-sela",
    crest: "plain",
    name: "Sela Quietwater",
    pitch: "A ferry keeper's daughter who learned stillness from the river and speed from the current.",
    difficulty: "first-pick",
    raceId: "human",
    classId: "monk",
    scores: { str: 12, dex: 15, con: 13, int: 10, wis: 14, cha: 8 },
    skills: ["acrobatics", "insight"],
    background: "Village Herbalist",
    alignment: "Lawful Good",
    languages: ["Elvish"],
    backgroundLanguages: ["Halfling"],
    classTool: "flute",
    kit: { choices: { "monk-weapon": "shortsword", "monk-pack": "explorers" } },
  },
  {
    id: "wren",
    sex: "female",
    portraitArt: "premade-wren",
    crest: "per-bend",
    name: "Wren Underbough",
    pitch: "A halfling who ran messages across the rooftops until an old master caught her, and kept her.",
    difficulty: "first-pick",
    raceId: "halfling",
    classId: "monk",
    scores: { str: 12, dex: 15, con: 13, int: 10, wis: 14, cha: 8 },
    skills: ["athletics", "religion"],
    background: "Street Runner",
    alignment: "Neutral Good",
    classTool: "calligraphers-supplies",
    kit: { choices: { "monk-weapon": "simple", "monk-pack": "dungeoneers" }, picks: { "monk-weapon/simple": ["quarterstaff"] } },
  },
  // Bards (DAG-59).
  {
    id: "ilyana",
    sex: "female",
    portraitArt: "premade-ilyana",
    crest: "quarterly",
    name: "Ilyana Voss",
    pitch: "A tavern singer who learned every street's songs, and that half of them are true.",
    difficulty: "many-options",
    raceId: "half-elf",
    classId: "bard",
    scores: { str: 8, dex: 14, con: 12, int: 10, wis: 13, cha: 15 },
    skills: ["performance", "persuasion", "insight"],
    background: "Street Runner",
    alignment: "Chaotic Good",
    languages: ["Halfling"],
    raceAbilities: ["dex", "con"],
    versatileSkills: ["deception", "acrobatics"],
    instruments: ["lute", "flute", "drum"],
    cantrips: ["vicious-mockery", "minor-illusion"],
    spells: ["healing-word", "sleep", "hideous-laughter", "charm-person"],
    kit: { choices: { "bard-weapon": "rapier", "bard-pack": "entertainers", "bard-instrument": "lute" } },
  },
  {
    id: "bram",
    sex: "male",
    portraitArt: "premade-bram",
    crest: "chevron",
    name: "Bram Tallowhorn",
    pitch: "A dwarven saga-keeper who sings the old clan histories loud enough to wake the ancestors in them.",
    difficulty: "many-options",
    raceId: "dwarf",
    classId: "bard",
    scores: { str: 8, dex: 14, con: 12, int: 10, wis: 13, cha: 15 },
    skills: ["performance", "history", "persuasion"],
    background: "Caravan Guard",
    alignment: "Lawful Good",
    tool: "brewers-supplies",
    instruments: ["horn", "drum", "viol"],
    backgroundLanguages: ["Giant"],
    cantrips: ["vicious-mockery", "light"],
    spells: ["cure-wounds", "thunderwave", "heroism", "bane"],
    kit: { choices: { "bard-weapon": "longsword", "bard-pack": "diplomats", "bard-instrument": "other" }, picks: { "bard-instrument/other": ["horn"] } },
  },
  // Warlocks (DAG-65).
  {
    id: "sable",
    sex: "female",
    portraitArt: "premade-sable",
    crest: "per-bend",
    name: "Sable Ashcroft",
    pitch: "A clerk who found a contract in the archive's lowest vault, signed it to see what would happen, and is still finding out.",
    difficulty: "many-options",
    raceId: "tiefling",
    classId: "warlock",
    scores: { str: 8, dex: 14, con: 13, int: 12, wis: 10, cha: 15 },
    skills: ["deception", "intimidation"],
    background: "Hedge Scholar",
    alignment: "Chaotic Neutral",
    backgroundLanguages: ["Abyssal", "Draconic"],
    cantrips: ["eldritch-blast", "minor-illusion"],
    spells: ["hellish-rebuke", "burning-hands"],
    kit: {
      choices: { "warlock-weapon": "crossbow", "warlock-focus": "arcane-focus", "warlock-pack": "scholars", "warlock-second": "simple" },
      picks: { "warlock-focus/arcane-focus": ["rod"], "warlock-second/simple": ["quarterstaff"] },
    },
  },
  {
    id: "tobin",
    sex: "male",
    portraitArt: "premade-tobin",
    crest: "plain",
    name: "Tobin Larkspur",
    pitch: "A halfling card sharp who bet his shadow on a hand he couldn't lose, and lost it to something that keeps paying him back.",
    difficulty: "many-options",
    raceId: "halfling",
    classId: "warlock",
    scores: { str: 8, dex: 14, con: 13, int: 12, wis: 10, cha: 15 },
    skills: ["deception", "investigation"],
    background: "Street Runner",
    alignment: "Neutral",
    cantrips: ["eldritch-blast", "prestidigitation"],
    spells: ["charm-person", "command"],
    kit: {
      choices: { "warlock-weapon": "simple", "warlock-focus": "component-pouch", "warlock-pack": "dungeoneers", "warlock-second": "simple" },
      picks: { "warlock-weapon/simple": ["mace"], "warlock-second/simple": ["sling"] },
    },
  },
  // Sorcerers (DAG-64).
  {
    id: "vessa",
    sex: "female",
    portraitArt: "premade-vessa",
    crest: "chevron",
    name: "Vessa Emberlyn",
    pitch: "The last daughter of a fallen house, whose temper runs as hot as the red dragon in her family's oldest portrait.",
    difficulty: "many-options",
    raceId: "human",
    classId: "sorcerer",
    scores: { str: 10, dex: 13, con: 14, int: 8, wis: 12, cha: 15 },
    skills: ["arcana", "intimidation"],
    background: "Exiled Heir",
    alignment: "Chaotic Good",
    languages: ["Elvish"],
    dragonAncestor: "red",
    backgroundLanguages: ["Infernal"],
    cantrips: ["fire-bolt", "prestidigitation", "light", "mage-hand"],
    spells: ["magic-missile", "shield"],
    kit: { choices: { "sorcerer-weapon": "crossbow", "sorcerer-focus": "arcane-focus", "sorcerer-pack": "explorers" }, picks: { "sorcerer-focus/arcane-focus": ["orb"] } },
  },
  {
    id: "corrin",
    sex: "male",
    portraitArt: "premade-corrin",
    crest: "per-pale",
    name: "Corrin Frostwhisper",
    pitch: "An elf whose breath fogs in summer, sent to study the old silver dragons' lore and learn why.",
    difficulty: "many-options",
    raceId: "elf",
    classId: "sorcerer",
    scores: { str: 10, dex: 13, con: 14, int: 8, wis: 12, cha: 15 },
    skills: ["insight", "deception"],
    background: "Hedge Scholar",
    alignment: "Neutral Good",
    languages: ["Sylvan"],
    racialCantrip: "minor-illusion",
    dragonAncestor: "silver",
    backgroundLanguages: ["Celestial", "Dwarvish"],
    cantrips: ["ray-of-frost", "shocking-grasp", "mage-hand", "light"],
    spells: ["shield", "sleep"],
    kit: {
      choices: { "sorcerer-weapon": "simple", "sorcerer-focus": "component-pouch", "sorcerer-pack": "dungeoneers" },
      picks: { "sorcerer-weapon/simple": ["quarterstaff"] },
    },
  },
  // Druids (DAG-60).
  {
    id: "orla",
    sex: "female",
    portraitArt: "premade-orla",
    crest: "per-pale",
    name: "Orla Brackenridge",
    pitch: "A shepherd from the high moors who listened to the heather long enough that it started answering.",
    difficulty: "many-options",
    raceId: "human",
    classId: "druid",
    scores: { str: 8, dex: 12, con: 14, int: 13, wis: 15, cha: 10 },
    skills: ["animal-handling", "nature"],
    background: "Frontier Scout",
    alignment: "Neutral Good",
    languages: ["Sylvan"],
    backgroundLanguages: ["Elvish"],
    cantrips: ["produce-flame", "shillelagh"],
    spells: ["healing-word", "entangle", "faerie-fire", "thunderwave"],
    kit: { choices: { "druid-shield": "wooden-shield", "druid-weapon": "scimitar", "druid-focus": "druidic-focus" }, picks: { "druid-focus/druidic-focus": ["sprig-of-mistletoe"] } },
  },
  {
    id: "pell",
    sex: "male",
    portraitArt: "premade-pell",
    crest: "quarterly",
    name: "Pell Marrowind",
    pitch: "A halfling who reads mushrooms the way scholars read books, and keeps notes on both.",
    difficulty: "many-options",
    raceId: "halfling",
    classId: "druid",
    scores: { str: 8, dex: 12, con: 14, int: 13, wis: 15, cha: 10 },
    skills: ["medicine", "perception"],
    background: "Hedge Scholar",
    alignment: "Neutral",
    backgroundLanguages: ["Sylvan", "Elvish"],
    cantrips: ["guidance", "druidcraft"],
    spells: ["goodberry", "cure-wounds", "fog-cloud"],
    kit: {
      choices: { "druid-shield": "simple", "druid-weapon": "simple-melee", "druid-focus": "druidic-focus" },
      picks: { "druid-shield/simple": ["quarterstaff"], "druid-weapon/simple-melee": ["sickle"], "druid-focus/druidic-focus": ["yew-wand"] },
    },
  },
  // Rangers (DAG-63).
  {
    id: "aren",
    sex: "male",
    portraitArt: "premade-aren",
    crest: "per-bend",
    name: "Aren Coldbrook",
    pitch: "A forester's son who walks the border woods and knows every goblin trail through them by its smell.",
    difficulty: "first-pick",
    raceId: "human",
    classId: "ranger",
    scores: { str: 12, dex: 15, con: 13, int: 8, wis: 14, cha: 10 },
    skills: ["perception", "nature", "athletics"],
    background: "Frontier Scout",
    alignment: "Neutral Good",
    languages: ["Elvish"],
    favoredEnemies: ["goblinoids", "orcs"],
    favoredEnemyLanguage: "Goblin",
    favoredTerrain: "forest",
    backgroundLanguages: ["Dwarvish"],
    kit: { choices: { "ranger-armor": "leather-armor", "ranger-weapons": "shortswords", "ranger-pack": "explorers" } },
  },
  {
    id: "saelis",
    sex: "male",
    portraitArt: "premade-saelis",
    crest: "plain",
    name: "Saelis Farwander",
    pitch: "An elf who keeps the mountain cairns, and puts back to rest whatever climbs out of them.",
    difficulty: "some-choices",
    raceId: "elf",
    classId: "ranger",
    scores: { str: 12, dex: 15, con: 13, int: 8, wis: 14, cha: 10 },
    skills: ["survival", "nature", "stealth"],
    background: "Acolyte",
    alignment: "Lawful Neutral",
    languages: ["Sylvan"],
    racialCantrip: "light",
    favoredEnemies: ["undead"],
    favoredTerrain: "mountain",
    backgroundLanguages: ["Celestial", "Dwarvish"],
    kit: {
      choices: { "ranger-armor": "scale-mail", "ranger-weapons": "simple-melee", "ranger-pack": "dungeoneers" },
      picks: { "ranger-weapons/simple-melee": ["spear", "handaxe"] },
    },
  },
  // Paladins (DAG-62).
  {
    id: "oswin",
    sex: "male",
    portraitArt: "premade-oswin",
    crest: "per-pale",
    name: "Oswin Hale",
    pitch: "A village watchman who swore an oath over a burned chapel and has kept it through every winter since.",
    difficulty: "first-pick",
    raceId: "human",
    classId: "paladin",
    scores: { str: 15, dex: 10, con: 13, int: 8, wis: 12, cha: 14 },
    skills: ["persuasion", "religion"],
    background: "Militia Veteran",
    alignment: "Lawful Good",
    languages: ["Dwarvish"],
    backgroundLanguages: ["Celestial"],
    kit: { choices: { "paladin-weapons": "martial-shield", "paladin-second": "javelins", "paladin-pack": "priests" }, picks: { "paladin-weapons/martial-shield": ["longsword"] } },
  },
  {
    id: "brenna",
    sex: "female",
    portraitArt: "premade-brenna",
    crest: "chevron",
    name: "Brenna Stonevow",
    pitch: "A temple warden of a clan that swore an oath to a gold dragon, and the only one of them who still keeps it.",
    difficulty: "some-choices",
    raceId: "dragonborn",
    classId: "paladin",
    scores: { str: 15, dex: 10, con: 13, int: 8, wis: 12, cha: 14 },
    skills: ["athletics", "medicine"],
    background: "Acolyte",
    alignment: "Lawful Neutral",
    draconicAncestry: "gold",
    backgroundLanguages: ["Celestial", "Giant"],
    kit: {
      choices: { "paladin-weapons": "two-martial", "paladin-second": "simple-melee", "paladin-pack": "explorers" },
      picks: { "paladin-weapons/two-martial": ["greatsword", "warhammer"], "paladin-second/simple-melee": ["mace"] },
    },
  },
];

export const getPremade = (id: string): PremadeHero => {
  const hero = PREMADE_HEROES.find((h) => h.id === id);
  if (!hero) throw new Error(`Unknown ready-made hero: ${id}`);
  return hero;
};

/** Names for Surprise me (original). */
export const HERO_NAMES = [
  "Alder Quell", "Brannoc Fey", "Cassia Thorne", "Dovan Reyes", "Edda Marsh", "Fennick Lowe", "Garet Vael", "Hesper Moor",
  "Ilka Brandt", "Joren Aske", "Kestrel Dunn", "Lio Tamsin", "Mirela Stroud", "Nim Calloway", "Odran Pike", "Petra Wynd",
  "Quinlan Hart", "Rook Ellery", "Saoirse Venn", "Tamsin Rook", "Ulric Fane", "Veska Lorne", "Wynn Harrow", "Yara Colt",
];

/** A ready-made party (DAG-108): four of the ready-made heroes, balanced, in their marching order. */
export interface ReadyParty {
  id: string;
  name: string;
  /** One line of story for the card. */
  pitch: string;
  /** Ready-made hero ids, the leader first. */
  heroes: string[];
}

export const READY_PARTIES: ReadyParty[] = [
  { id: "ford-watch", name: "The Ford Watch", pitch: "A militia sergeant, a forge priest, a rooftop runner and a self-taught mage: the ones you would want at a ford.", heroes: ["brakk", "tomas", "vesper", "elowen"] },
  { id: "lanterns", name: "The Lanterns", pitch: "An oath-sworn watchman leads a disinherited heir, a moorland druid and a frost-touched sorcerer down the dark roads.", heroes: ["oswin", "isolde", "orla", "corrin"] },
  { id: "wayfarers", name: "The Wayfarers", pitch: "A trail guide, a cairn-keeper, a card sharp and a village healer who never stay two nights under one roof.", heroes: ["kaija", "saelis", "tobin", "maren"] },
  { id: "ashbeard", name: "Ashbeard's Company", pitch: "A caravan guard's crew: a rooftop monk, a saga-singing bard and an archivist with the wrong spellbook.", heroes: ["dorn", "wren", "bram", "corvin"] },
];
