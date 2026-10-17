// Encounter tables for generated worlds (DAG-33, from the DAG-5 report, sections 3 and 4).
//
// Clean-room note: these tables are our own choices. The SRD gives monsters no habitats, and the
// Monster Manual's habitat lists and the DMG's random tables are not in the SRD, so neither was
// consulted or copied. Each entry is a judgement of where an SRD 5.1 creature would plausibly be
// met in our worlds: by biome, by how wild the land is (the world's `wild` layer: calm, wild,
// untamed), by whether it is blighted or blessed (the `alignment` layer), and by site kind. The
// first version covers the creatures of CR 2 or lower, the range a level 1-3 hero meets; every one
// of them is in a table or listed in NOT_IN_ENCOUNTER_TABLES with the reason.
//
// The XP budget per character is from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards
// of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the
// Creative Commons Attribution 4.0 International License, available at
// https://creativecommons.org/licenses/by/4.0/legalcode. (Page 202, "Combat Encounter Difficulty".)

/** A weighted table row: a group of one SRD monster, maybe led or joined by others. */
export interface EncounterEntry {
  monsterId: string;
  /** How many, before the budget trims the group. */
  min: number;
  max: number;
  /** Relative chance within the merged table (whole numbers). */
  weight: number;
  /** Creatures that come with them: a bandit captain's bandits, a priest's acolytes. */
  with?: readonly { monsterId: string; min: number; max: number }[];
}

const e = (monsterId: string, min: number, max: number, weight: number, ...with_: [string, number, number][]): EncounterEntry => ({
  monsterId,
  min,
  max,
  weight,
  ...(with_.length ? { with: with_.map(([id, lo, hi]) => ({ monsterId: id, min: lo, max: hi })) } : {}),
});

/** By the world's biome key (worldgen BIOMES). Water is for coasts, lakes and crossings. */
export const BIOME_ENCOUNTERS: Record<string, readonly EncounterEntry[]> = {
  water: [
    e("giant-crab", 1, 3, 3), e("crab", 2, 6, 1), e("octopus", 1, 2, 1), e("giant-octopus", 1, 1, 2), e("reef-shark", 1, 2, 3),
    e("hunter-shark", 1, 1, 2), e("quipper", 3, 8, 1), e("swarm-of-quippers", 1, 2, 2), e("giant-sea-horse", 1, 2, 1),
    e("plesiosaurus", 1, 1, 1), e("merfolk", 2, 5, 2), e("sahuagin", 2, 4, 3), e("merrow", 1, 1, 2), e("sea-hag", 1, 1, 1),
    e("steam-mephit", 1, 3, 1),
  ],
  ice: [
    e("polar-bear", 1, 1, 3), e("wolf", 2, 5, 2), e("saber-toothed-tiger", 1, 1, 2), e("ice-mephit", 1, 3, 2),
    e("white-dragon-wyrmling", 1, 1, 1), e("tribal-warrior", 2, 5, 2), e("giant-owl", 1, 2, 1),
  ],
  taiga: [
    e("wolf", 2, 6, 4), e("dire-wolf", 1, 2, 2), e("brown-bear", 1, 1, 3), e("black-bear", 1, 1, 2), e("elk", 1, 4, 2),
    e("giant-elk", 1, 1, 1), e("giant-owl", 1, 2, 2), e("owl", 1, 3, 1), e("worg", 1, 3, 2), e("saber-toothed-tiger", 1, 1, 1),
    e("giant-badger", 1, 2, 1), e("badger", 1, 3, 1), e("giant-weasel", 1, 3, 2), e("weasel", 2, 5, 1),
  ],
  tundra: [
    e("wolf", 2, 6, 3), e("elk", 1, 4, 2), e("giant-elk", 1, 1, 1), e("polar-bear", 1, 1, 1), e("ice-mephit", 1, 2, 1),
    e("axe-beak", 1, 3, 2), e("giant-goat", 1, 3, 2), e("goat", 2, 6, 1), e("eagle", 1, 3, 1), e("tribal-warrior", 2, 5, 2),
    e("saber-toothed-tiger", 1, 1, 1),
  ],
  "temperate-forest": [
    e("wolf", 2, 6, 3), e("boar", 1, 3, 3), e("giant-boar", 1, 1, 1), e("black-bear", 1, 1, 2), e("brown-bear", 1, 1, 2),
    e("giant-spider", 1, 2, 2), e("giant-wolf-spider", 1, 3, 2), e("ettercap", 1, 1, 1, ["giant-spider", 0, 1]), e("giant-owl", 1, 1, 1),
    e("deer", 2, 6, 1), e("panther", 1, 2, 1), e("constrictor-snake", 1, 1, 1), e("poisonous-snake", 1, 3, 1),
    e("swarm-of-insects", 1, 2, 1), e("raven", 3, 6, 1), e("swarm-of-ravens", 1, 2, 1), e("awakened-tree", 1, 1, 1),
    e("awakened-shrub", 2, 6, 1), e("violet-fungus", 1, 3, 1, ["shrieker", 1, 2]), e("green-dragon-wyrmling", 1, 1, 1),
    e("goblin", 3, 6, 2), e("bugbear", 1, 1, 1, ["goblin", 1, 3]), e("elk", 1, 3, 1),
  ],
  woodland: [
    e("wolf", 2, 5, 2), e("boar", 1, 3, 2), e("elk", 1, 4, 2), e("deer", 2, 6, 1), e("hawk", 2, 4, 1), e("blood-hawk", 2, 6, 2),
    e("goblin", 3, 6, 2), e("hobgoblin", 2, 4, 2), e("orc", 2, 4, 2), e("giant-wasp", 1, 3, 1), e("swarm-of-wasps", 1, 2, 1),
    e("centaur", 1, 2, 1), e("hippogriff", 1, 2, 1), e("brown-bear", 1, 1, 1), e("black-bear", 1, 1, 1), e("giant-badger", 1, 2, 1),
    e("cockatrice", 1, 2, 1), e("ankheg", 1, 1, 1), e("badger", 1, 3, 1), e("weasel", 2, 5, 1), e("owl", 1, 2, 1),
  ],
  steppe: [
    e("wolf", 2, 6, 2), e("jackal", 3, 8, 1), e("hyena", 2, 6, 2), e("giant-hyena", 1, 2, 1), e("gnoll", 2, 5, 3),
    e("axe-beak", 1, 4, 2), e("elk", 1, 4, 1), e("giant-elk", 1, 1, 1), e("vulture", 2, 6, 1), e("giant-vulture", 1, 2, 1),
    e("orc", 2, 4, 2), e("centaur", 1, 3, 2), e("griffon", 1, 2, 1), e("tribal-warrior", 2, 6, 2), e("worg", 2, 4, 1),
    e("cockatrice", 1, 2, 1), e("giant-goat", 1, 3, 1),
  ],
  jungle: [
    e("ape", 1, 4, 3), e("baboon", 3, 8, 1), e("panther", 1, 2, 2), e("tiger", 1, 1, 2), e("constrictor-snake", 1, 1, 2),
    e("giant-constrictor-snake", 1, 1, 1), e("poisonous-snake", 1, 4, 1), e("giant-poisonous-snake", 1, 2, 2), e("flying-snake", 1, 4, 1),
    e("swarm-of-poisonous-snakes", 1, 1, 1), e("crocodile", 1, 2, 2), e("giant-frog", 1, 4, 2), e("giant-toad", 1, 2, 1),
    e("lizardfolk", 2, 5, 3), e("giant-lizard", 1, 2, 1), e("swarm-of-insects", 1, 2, 2), e("giant-wasp", 1, 3, 1), e("stirge", 2, 6, 2),
    e("black-dragon-wyrmling", 1, 1, 1), e("quipper", 3, 8, 1), e("giant-centipede", 1, 3, 1), e("swarm-of-centipedes", 1, 2, 1),
  ],
  savanna: [
    e("lion", 1, 3, 3), e("hyena", 2, 6, 2), e("giant-hyena", 1, 2, 1), e("jackal", 2, 6, 1), e("baboon", 3, 8, 1),
    e("rhinoceros", 1, 1, 2), e("vulture", 2, 6, 1), e("giant-vulture", 1, 2, 1), e("gnoll", 2, 5, 2), e("tribal-warrior", 2, 6, 2),
    e("giant-wasp", 1, 3, 1), e("constrictor-snake", 1, 1, 1), e("crocodile", 1, 2, 1), e("blood-hawk", 2, 5, 1),
    e("giant-poisonous-snake", 1, 2, 1), e("panther", 1, 2, 1),
  ],
  desert: [
    e("jackal", 3, 8, 2), e("hyena", 2, 5, 1), e("vulture", 2, 6, 2), e("giant-vulture", 1, 2, 1), e("giant-lizard", 1, 2, 2),
    e("lizard", 2, 6, 1), e("scorpion", 2, 6, 1), e("poisonous-snake", 1, 4, 2), e("giant-poisonous-snake", 1, 2, 1),
    e("swarm-of-insects", 1, 2, 1), e("dust-mephit", 1, 3, 3), e("gnoll", 2, 5, 2), e("brass-dragon-wyrmling", 1, 1, 1),
    e("giant-centipede", 1, 3, 1), e("tribal-warrior", 2, 6, 2), e("death-dog", 1, 2, 1),
  ],
};

/** By the `wild` layer: calm land near settlements, wild land, untamed land far from any. */
export const WILDNESS_ENCOUNTERS: Record<"calm" | "wild" | "untamed", readonly EncounterEntry[]> = {
  calm: [
    e("bandit", 2, 6, 3), e("thug", 1, 3, 2), e("guard", 2, 4, 1), e("mastiff", 1, 3, 1), e("cultist", 2, 5, 1), e("spy", 1, 1, 1),
    e("scout", 1, 3, 1), e("giant-rat", 2, 6, 1), e("rat", 3, 8, 1), e("swarm-of-rats", 1, 2, 1), e("wererat-human", 1, 1, 1),
  ],
  wild: [
    e("bandit", 2, 6, 2), e("bandit-captain", 1, 1, 1, ["bandit", 2, 4]), e("orc", 2, 4, 2), e("goblin", 3, 6, 2), e("kobold", 3, 8, 2),
    e("hobgoblin", 2, 4, 1, ["goblin", 0, 2]), e("gnoll", 2, 4, 1), e("scout", 1, 3, 1), e("berserker", 1, 2, 1), e("tribal-warrior", 2, 5, 1),
    e("worg", 1, 3, 1), e("ogre", 1, 1, 1), e("bugbear", 1, 2, 1),
  ],
  untamed: [
    e("ogre", 1, 1, 2), e("worg", 1, 3, 1, ["goblin", 0, 2]), e("dire-wolf", 1, 2, 1), e("griffon", 1, 1, 1), e("hippogriff", 1, 2, 1),
    e("harpy", 1, 3, 2), e("ankheg", 1, 1, 1), e("death-dog", 1, 2, 1), e("berserker", 1, 3, 1), e("orc", 2, 5, 2),
    e("gnoll", 2, 5, 1), e("giant-eagle", 1, 2, 1), e("giant-boar", 1, 1, 1),
  ],
};

/** By the `alignment` layer. Neutral land adds nothing of its own. */
export const ALIGNMENT_ENCOUNTERS: Record<"blighted" | "neutral" | "blessed", readonly EncounterEntry[]> = {
  blighted: [
    e("zombie", 2, 6, 3), e("skeleton", 2, 6, 3), e("ghoul", 1, 3, 2), e("ghast", 1, 1, 1, ["ghoul", 1, 2]), e("shadow", 1, 3, 1),
    e("specter", 1, 1, 1), e("will-o-wisp", 1, 1, 1), e("ogre-zombie", 1, 1, 1), e("warhorse-skeleton", 1, 2, 1, ["skeleton", 0, 2]),
    e("minotaur-skeleton", 1, 1, 1), e("imp", 1, 1, 1), e("quasit", 1, 1, 1), e("dretch", 2, 4, 1), e("lemure", 2, 6, 1),
    e("cult-fanatic", 1, 1, 2, ["cultist", 2, 4]), e("cultist", 2, 5, 1), e("death-dog", 1, 2, 1), e("giant-rat-diseased", 3, 6, 1),
    e("swarm-of-ravens", 1, 2, 1), e("stirge", 2, 6, 1), e("gibbering-mouther", 1, 1, 1), e("harpy", 1, 3, 1),
  ],
  neutral: [],
  blessed: [
    e("pegasus", 1, 1, 1), e("blink-dog", 2, 4, 2), e("sprite", 2, 5, 2), e("pseudodragon", 1, 1, 1), e("dryad", 1, 1, 1),
    e("satyr", 1, 3, 1), e("giant-eagle", 1, 2, 2), e("giant-owl", 1, 2, 1), e("druid", 1, 1, 1, ["wolf", 0, 2]), e("centaur", 1, 2, 1),
    e("silver-dragon-wyrmling", 1, 1, 1), e("copper-dragon-wyrmling", 1, 1, 1), e("bronze-dragon-wyrmling", 1, 1, 1),
  ],
};

/** By site kind (worldgen Site.kind). A site's own table weighs more than the land around it. */
export const SITE_ENCOUNTERS: Record<"dungeon" | "ruin" | "lair" | "cave" | "shrine" | "landmark" | "settlement", readonly EncounterEntry[]> = {
  dungeon: [
    e("skeleton", 2, 6, 3), e("zombie", 2, 5, 2), e("goblin", 3, 6, 2), e("hobgoblin", 1, 1, 1, ["goblin", 2, 4]), e("kobold", 3, 8, 2),
    e("giant-rat", 2, 6, 1), e("rat", 3, 8, 1), e("swarm-of-rats", 1, 2, 1), e("animated-armor", 1, 2, 2), e("flying-sword", 1, 4, 2),
    e("rug-of-smothering", 1, 1, 1), e("mimic", 1, 1, 1), e("gelatinous-cube", 1, 1, 1), e("gray-ooze", 1, 2, 1), e("ochre-jelly", 1, 1, 1),
    e("rust-monster", 1, 2, 1), e("darkmantle", 1, 3, 1), e("grick", 1, 1, 1), e("homunculus", 1, 1, 1), e("gargoyle", 1, 2, 1),
    e("shadow", 1, 2, 1), e("ghoul", 1, 2, 1), e("giant-centipede", 1, 3, 1), e("swarm-of-centipedes", 1, 2, 1), e("stirge", 2, 6, 1),
    e("bugbear", 1, 1, 1, ["goblin", 2, 4]), e("cult-fanatic", 1, 1, 1, ["cultist", 2, 4]), e("minotaur-skeleton", 1, 1, 1),
    e("duergar", 1, 3, 1), e("imp", 1, 1, 1), e("quasit", 1, 1, 1), e("magmin", 1, 2, 1), e("azer", 1, 1, 1),
    e("wererat-hybrid", 1, 1, 1, ["giant-rat", 1, 3]), e("dretch", 2, 4, 1),
  ],
  ruin: [
    e("skeleton", 2, 6, 3), e("zombie", 2, 5, 2), e("ghoul", 1, 3, 1), e("shadow", 1, 2, 1), e("specter", 1, 1, 1), e("will-o-wisp", 1, 1, 1),
    e("giant-rat", 2, 6, 1), e("swarm-of-rats", 1, 2, 1), e("swarm-of-bats", 1, 2, 1), e("stirge", 2, 6, 1), e("kobold", 3, 8, 1),
    e("goblin", 3, 6, 1), e("bandit-captain", 1, 1, 1, ["bandit", 2, 4]), e("bandit", 2, 6, 1), e("gargoyle", 1, 2, 1),
    e("cockatrice", 1, 2, 1), e("giant-spider", 1, 2, 1), e("harpy", 1, 3, 1), e("ogre", 1, 1, 1), e("warhorse-skeleton", 1, 2, 1),
    e("animated-armor", 1, 1, 1), e("mimic", 1, 1, 1), e("gray-ooze", 1, 2, 1), e("wererat-hybrid", 1, 1, 1, ["swarm-of-rats", 0, 1]),
    e("awakened-shrub", 2, 6, 1), e("awakened-tree", 1, 1, 1),
  ],
  lair: [
    e("ogre", 1, 1, 2), e("dire-wolf", 1, 1, 2, ["wolf", 1, 3]), e("worg", 1, 1, 1, ["goblin", 1, 3]), e("brown-bear", 1, 1, 2),
    e("ettercap", 1, 1, 1, ["giant-spider", 1, 2]), e("ankheg", 1, 1, 1), e("griffon", 1, 2, 1), e("hippogriff", 1, 2, 1), e("harpy", 1, 3, 1),
    e("black-dragon-wyrmling", 1, 1, 1), e("green-dragon-wyrmling", 1, 1, 1), e("white-dragon-wyrmling", 1, 1, 1),
    e("brass-dragon-wyrmling", 1, 1, 1), e("giant-boar", 1, 1, 1), e("saber-toothed-tiger", 1, 1, 1), e("tiger", 1, 1, 1), e("lion", 1, 2, 1),
    e("gnoll", 2, 5, 1), e("bugbear", 1, 2, 1), e("death-dog", 1, 2, 1), e("giant-toad", 1, 2, 1), e("crocodile", 1, 2, 1),
    e("giant-constrictor-snake", 1, 1, 1), e("giant-hyena", 1, 2, 1), e("polar-bear", 1, 1, 1),
  ],
  cave: [
    e("swarm-of-bats", 1, 2, 2), e("giant-bat", 1, 3, 2), e("bat", 3, 8, 1), e("darkmantle", 1, 3, 2), e("grick", 1, 1, 1),
    e("giant-centipede", 1, 3, 1), e("giant-fire-beetle", 2, 6, 2), e("swarm-of-beetles", 1, 2, 1), e("swarm-of-spiders", 1, 2, 1),
    e("spider", 3, 8, 1), e("giant-spider", 1, 2, 1), e("gray-ooze", 1, 2, 1), e("ochre-jelly", 1, 1, 1), e("violet-fungus", 1, 3, 1, ["shrieker", 1, 2]),
    e("kobold", 3, 8, 2), e("goblin", 3, 6, 1), e("grimlock", 2, 6, 2), e("drow", 2, 4, 1), e("deep-gnome-svirfneblin", 1, 4, 1),
    e("duergar", 1, 3, 1), e("magma-mephit", 1, 3, 1), e("magmin", 1, 2, 1), e("steam-mephit", 1, 3, 1), e("gibbering-mouther", 1, 1, 1),
    e("giant-frog", 1, 3, 1), e("rust-monster", 1, 1, 1),
  ],
  shrine: [
    e("acolyte", 2, 4, 2), e("priest", 1, 1, 1, ["acolyte", 1, 3]), e("cult-fanatic", 1, 1, 2, ["cultist", 2, 4]), e("cultist", 2, 5, 1),
    e("guard", 2, 4, 1), e("druid", 1, 1, 1), e("animated-armor", 1, 2, 1), e("flying-sword", 1, 3, 1), e("gargoyle", 1, 2, 1),
    e("specter", 1, 1, 1), e("will-o-wisp", 1, 1, 1), e("imp", 1, 1, 1), e("quasit", 1, 1, 1), e("skeleton", 2, 5, 1), e("shadow", 1, 2, 1),
    e("dryad", 1, 1, 1),
  ],
  landmark: [
    e("harpy", 1, 3, 2), e("griffon", 1, 2, 1), e("giant-eagle", 1, 2, 1), e("eagle", 1, 3, 1), e("hippogriff", 1, 2, 1),
    e("giant-vulture", 1, 2, 1), e("vulture", 2, 6, 1), e("gargoyle", 1, 2, 1), e("will-o-wisp", 1, 1, 1), e("ankheg", 1, 1, 1),
    e("awakened-tree", 1, 1, 1), e("centaur", 1, 2, 1), e("giant-goat", 1, 3, 1), e("satyr", 1, 3, 1), e("blink-dog", 2, 4, 1),
    e("copper-dragon-wyrmling", 1, 1, 1), e("bronze-dragon-wyrmling", 1, 1, 1), e("silver-dragon-wyrmling", 1, 1, 1),
  ],
  settlement: [
    e("thug", 1, 3, 3), e("bandit", 2, 4, 2), e("guard", 2, 4, 2), e("cultist", 2, 4, 1), e("cult-fanatic", 1, 1, 1, ["cultist", 1, 3]),
    e("spy", 1, 1, 1), e("bandit-captain", 1, 1, 1, ["thug", 1, 2]), e("wererat-human", 1, 1, 1), e("giant-rat", 2, 6, 1),
    e("swarm-of-rats", 1, 2, 1), e("rat", 3, 8, 1), e("mastiff", 1, 3, 1), e("noble", 1, 1, 1, ["guard", 2, 3]),
  ],
};

/**
 * The CR 2 and lower creatures no table names, and why: people and animals met as people and
 * animals rather than as fights, harmless creatures worth no XP, and alternate forms.
 */
export const NOT_IN_ENCOUNTER_TABLES: Record<string, string> = {
  commoner: "townsfolk: met as people in settlements, not as a fight",
  frog: "harmless and worth no XP",
  "sea-horse": "harmless and worth no XP",
  cat: "a pet",
  mule: "a pack animal: bought or hired, not fought",
  pony: "a mount: bought or hired, not fought",
  "draft-horse": "a draft animal: bought or hired, not fought",
  "riding-horse": "a mount: bought or hired, not fought",
  warhorse: "a mount: bought or hired, not fought",
  camel: "a mount: bought or hired, not fought",
  "wererat-rat": "the wererat's rat form; the tables use its human and hybrid forms",
};

/**
 * SRD 5.2.1 XP Budget per Character (Low, Moderate, High) for party levels 1-20. Multiply by the
 * number of characters for the party's budget; this solo game has one.
 */
export const XP_BUDGET_PER_CHARACTER: readonly (readonly [number, number, number])[] = [
  [50, 75, 100], [100, 150, 200], [150, 225, 400], [250, 375, 500], [500, 750, 1100],
  [600, 1000, 1400], [750, 1300, 1700], [1000, 1700, 2100], [1300, 2000, 2600], [1600, 2300, 3100],
  [1900, 2900, 4100], [2200, 3700, 4700], [2600, 4200, 5400], [2900, 4900, 6200], [3300, 5400, 7800],
  [3800, 6100, 9800], [4500, 7200, 11700], [5000, 8700, 14200], [5500, 10700, 17200], [6400, 13200, 22000],
];
