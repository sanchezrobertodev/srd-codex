// The choices SRD 5.1 asks for on gaining a level (DAG-183) that the class data doesn't spell out:
// each class's subclass, Metamagic, Eldritch Invocations, Pact Boons, Hunter's Prey, the Circle of the
// Land's terrains and the spells that come with a domain, an oath or a circle. Names are the SRD's;
// the descriptions are this game's own short words.

/** One choice on the level-up screen: an id, a name, and a line on what it does. */
export interface LevelOptionData {
  id: string;
  name: string;
  description: string;
}

/** A subclass's features after the one that chooses it, by class level (shown in the level-up summary). */
export interface SubclassData extends LevelOptionData {
  classId: string;
  /** The class level the subclass is chosen at. */
  level: number;
  /** The class feature that chooses it ("primal-path"), and the ones that improve it ("primal-path-improvement-1"). */
  feature: string;
  features: { level: number; name: string; description: string }[];
}

/**
 * The SRD 5.1 subclass of each class: one each. The Cleric's domain, the Sorcerer's origin and the
 * Warlock's patron are chosen at level 1, in the character creator; the rest on levelling up.
 */
export const SUBCLASSES: SubclassData[] = [
  {
    id: "berserker", classId: "barbarian", level: 3, feature: "primal-path", name: "Path of the Berserker",
    description: "Rage turns to frenzy: more attacks while it lasts, at the cost of exhaustion after.",
    features: [
      { level: 3, name: "Frenzy", description: "While raging you can frenzy: a melee weapon attack as a bonus action each turn, and a level of exhaustion when the rage ends." },
      { level: 6, name: "Mindless Rage", description: "No charm or fright touches you while you rage." },
      { level: 10, name: "Intimidating Presence", description: "Your action can frighten a creature that fails a Wisdom save." },
      { level: 14, name: "Retaliation", description: "Hurt by a creature within 5 feet, you can strike back with your reaction." },
    ],
  },
  {
    id: "lore", classId: "bard", level: 3, feature: "bard-college", name: "College of Lore",
    description: "A collector of knowledge: three more skills, and words that spoil a foe's roll.",
    features: [
      { level: 3, name: "Bonus Proficiencies", description: "Proficiency in three skills of your choice." },
      { level: 3, name: "Cutting Words", description: "Spend a Bardic Inspiration as a reaction to take the die off a creature's attack, check or damage roll." },
      { level: 6, name: "Additional Magical Secrets", description: "Two spells from any class's list." },
      { level: 14, name: "Peerless Skill", description: "Add a Bardic Inspiration die to your own ability check." },
    ],
  },
  {
    id: "life", classId: "cleric", level: 1, feature: "divine-domain", name: "Life Domain",
    description: "A healer: heavy armor, and healing spells that restore more.",
    features: [
      { level: 1, name: "Disciple of Life", description: "Healing spells of 1st level or higher restore 2 + the spell's level more." },
      { level: 2, name: "Channel Divinity: Preserve Life", description: "Share out hit points equal to five times your cleric level among creatures near you." },
      { level: 6, name: "Blessed Healer", description: "Healing others with a spell heals you too." },
      { level: 8, name: "Divine Strike", description: "Once a turn, a weapon hit deals an extra 1d8 radiant damage." },
      { level: 17, name: "Supreme Healing", description: "Healing dice always roll their highest." },
    ],
  },
  {
    id: "land", classId: "druid", level: 2, feature: "druid-circle", name: "Circle of the Land",
    description: "A keeper of one land's lore: a bonus cantrip, spells of that land, and slots back on a short rest.",
    features: [
      { level: 2, name: "Bonus Cantrip", description: "One more druid cantrip." },
      { level: 2, name: "Natural Recovery", description: "Once a day, a short rest gives back spell slots of combined level up to half your druid level." },
      { level: 3, name: "Circle Spells", description: "The spells of your chosen land, always prepared." },
      { level: 6, name: "Land's Stride", description: "Nonmagical difficult terrain and plants slow and hurt you no more." },
      { level: 10, name: "Nature's Ward", description: "No disease or poison, and no charm or fright from elementals and fey." },
      { level: 14, name: "Nature's Sanctuary", description: "Beasts and plants must save before they can attack you." },
    ],
  },
  {
    id: "champion", classId: "fighter", level: 3, feature: "martial-archetype", name: "Champion",
    description: "Raw physical excellence: critical hits come more often.",
    features: [
      { level: 3, name: "Improved Critical", description: "Your weapon attacks score a critical hit on a 19 or 20." },
      { level: 7, name: "Remarkable Athlete", description: "Half your proficiency bonus on Strength, Dexterity and Constitution checks you aren't proficient in." },
      { level: 10, name: "Additional Fighting Style", description: "A second fighting style." },
      { level: 15, name: "Superior Critical", description: "Critical hits on 18 to 20." },
      { level: 18, name: "Survivor", description: "Regain hit points each turn while at half or less." },
    ],
  },
  {
    id: "open-hand", classId: "monk", level: 3, feature: "monastic-tradition", name: "Way of the Open Hand",
    description: "A master of unarmed combat: Flurry of Blows that topples, pushes or stops reactions.",
    features: [
      { level: 3, name: "Open Hand Technique", description: "A Flurry of Blows hit can knock the target prone, push it 15 feet, or stop its reactions." },
      { level: 6, name: "Wholeness of Body", description: "Once per long rest, heal yourself three times your monk level." },
      { level: 11, name: "Tranquility", description: "A sanctuary on yourself after each long rest." },
      { level: 17, name: "Quivering Palm", description: "Set deadly vibrations in a creature you hit." },
    ],
  },
  {
    id: "devotion", classId: "paladin", level: 3, feature: "sacred-oath", name: "Oath of Devotion",
    description: "The ideals of honesty, courage and mercy: oath spells and a blessed weapon.",
    features: [
      { level: 3, name: "Oath Spells", description: "Protection from Evil and Good and Sanctuary, always prepared; more at 5th, 9th, 13th and 17th level." },
      { level: 3, name: "Channel Divinity", description: "Sacred Weapon (add Charisma to attack rolls for a minute) or Turn the Unholy (fiends and undead flee)." },
      { level: 7, name: "Aura of Devotion", description: "You and allies near you can't be charmed." },
      { level: 15, name: "Purity of Spirit", description: "Always under Protection from Evil and Good." },
      { level: 20, name: "Holy Nimbus", description: "Radiant light that burns your foes." },
    ],
  },
  {
    id: "hunter", classId: "ranger", level: 3, feature: "ranger-archetype", name: "Hunter",
    description: "A bulwark against the worst of the wild: a hunter's technique to choose.",
    features: [
      { level: 3, name: "Hunter's Prey", description: "Colossus Slayer, Giant Killer or Horde Breaker." },
      { level: 7, name: "Defensive Tactics", description: "A defensive technique of your choice." },
      { level: 11, name: "Multiattack", description: "Volley or Whirlwind Attack." },
      { level: 15, name: "Superior Hunter's Defense", description: "Evasion, Stand Against the Tide or Uncanny Dodge." },
    ],
  },
  {
    id: "thief", classId: "rogue", level: 3, feature: "roguish-archetype", name: "Thief",
    description: "Burglar and treasure hunter: quick hands and a climber's legs.",
    features: [
      { level: 3, name: "Fast Hands", description: "Cunning Action can also make a Sleight of Hand check, use thieves' tools or use an object." },
      { level: 3, name: "Second-Story Work", description: "Climbing costs no extra movement, and running jumps go farther." },
      { level: 9, name: "Supreme Sneak", description: "Advantage on Stealth while moving at half speed." },
      { level: 13, name: "Use Magic Device", description: "Ignore class, race and level requirements on magic items." },
      { level: 17, name: "Thief's Reflexes", description: "Two turns in the first round of a fight." },
    ],
  },
  {
    id: "draconic", classId: "sorcerer", level: 1, feature: "sorcerous-origin", name: "Draconic Bloodline",
    description: "Dragon blood: tougher, scaled skin and the ancestor's element.",
    features: [
      { level: 1, name: "Draconic Resilience", description: "One more hit point per level, and AC 13 + Dexterity without armor." },
      { level: 6, name: "Elemental Affinity", description: "Add Charisma to damage of your ancestor's type." },
      { level: 14, name: "Dragon Wings", description: "Sprout wings and fly." },
      { level: 18, name: "Draconic Presence", description: "An aura of awe or fear." },
    ],
  },
  {
    id: "fiend", classId: "warlock", level: 1, feature: "otherworldly-patron", name: "The Fiend",
    description: "A pact with a power of the lower planes: fire spells, and vigour from each foe you fell.",
    features: [
      { level: 1, name: "Dark One's Blessing", description: "Temporary hit points when you drop a hostile creature to 0." },
      { level: 6, name: "Dark One's Own Luck", description: "Add a d10 to an ability check or save, once per rest." },
      { level: 10, name: "Fiendish Resilience", description: "Resistance to a damage type you choose after each rest." },
      { level: 14, name: "Hurl Through Hell", description: "Send a creature you hit through the lower planes." },
    ],
  },
  {
    id: "evocation", classId: "wizard", level: 2, feature: "arcane-tradition", name: "School of Evocation",
    description: "A shaper of raw energy: blasts that spare your friends.",
    features: [
      { level: 2, name: "Evocation Savant", description: "Copying evocation spells costs half the gold and time." },
      { level: 2, name: "Sculpt Spells", description: "Allies caught in your evocation spells succeed on their saves and take no damage." },
      { level: 6, name: "Potent Cantrip", description: "A cantrip's target that succeeds on the save still takes half damage." },
      { level: 10, name: "Empowered Evocation", description: "Add Intelligence to one damage roll of a wizard evocation spell." },
      { level: 14, name: "Overchannel", description: "Deal a spell's highest damage, at a cost." },
    ],
  },
];

export const subclassFor = (classId: string): SubclassData[] => SUBCLASSES.filter((s) => s.classId === classId);
export const findSubclass = (id: string | undefined): SubclassData | undefined => SUBCLASSES.find((s) => s.id === id);

/**
 * The fighting styles each class may choose (SRD 5.1): the Fighter all six at level 1, the Paladin and
 * the Ranger four each at level 2. Ids are those of FIGHTING_STYLES.
 */
export const CLASS_FIGHTING_STYLES: Record<string, readonly string[]> = {
  fighter: ["archery", "defense", "dueling", "great-weapon-fighting", "protection", "two-weapon-fighting"],
  paladin: ["defense", "dueling", "great-weapon-fighting", "protection"],
  ranger: ["archery", "defense", "dueling", "two-weapon-fighting"],
};

/** Sorcerer Metamagic (SRD 5.1): two at 3rd level, one more at 10th and 17th. */
export const METAMAGIC: LevelOptionData[] = [
  { id: "careful", name: "Careful Spell", description: "1 sorcery point: up to your Charisma modifier of creatures pass their save against your spell." },
  { id: "distant", name: "Distant Spell", description: "1 sorcery point: double the spell's range, or touch becomes 30 feet." },
  { id: "empowered", name: "Empowered Spell", description: "1 sorcery point: reroll up to your Charisma modifier of the damage dice." },
  { id: "extended", name: "Extended Spell", description: "1 sorcery point: a spell of a minute or more lasts twice as long." },
  { id: "heightened", name: "Heightened Spell", description: "3 sorcery points: one target has disadvantage on its first save against the spell." },
  { id: "quickened", name: "Quickened Spell", description: "2 sorcery points: a spell of one action is cast as a bonus action." },
  { id: "subtle", name: "Subtle Spell", description: "1 sorcery point: cast without words or gestures." },
  { id: "twinned", name: "Twinned Spell", description: "Sorcery points equal to the spell's level: a single-target spell hits a second creature." },
];

export const metamagicCount = (level: number): number => (level >= 17 ? 4 : level >= 10 ? 3 : level >= 3 ? 2 : 0);

/** Warlock Pact Boons (SRD 5.1), chosen at 3rd level. */
export const PACT_BOONS: LevelOptionData[] = [
  { id: "chain", name: "Pact of the Chain", description: "Find Familiar as a ritual, with an imp, pseudodragon, quasit or sprite to choose from." },
  { id: "blade", name: "Pact of the Blade", description: "Summon a magic melee weapon of your choice, which you are proficient with." },
  { id: "tome", name: "Pact of the Tome", description: "A Book of Shadows with three cantrips from any class's list." },
];

/**
 * Eldritch Invocations known by warlock level (SRD 5.1's Warlock table). The imported class table has
 * 3 at 4th level and 4 at 6th, a level early (DAG-189): this one is the SRD's.
 */
export const INVOCATIONS_KNOWN: readonly number[] = [0, 0, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8];

/** Pact of the Tome: the cantrips from any class it gives. */
export const TOME_CANTRIPS = 3;

/** An Eldritch Invocation (SRD 5.1), with what it needs: a warlock level, a pact boon, or a cantrip known. */
export interface InvocationData extends LevelOptionData {
  level?: number;
  pact?: "chain" | "blade" | "tome";
  cantrip?: string;
}

export const ELDRITCH_INVOCATIONS: InvocationData[] = [
  { id: "agonizing-blast", name: "Agonizing Blast", cantrip: "eldritch-blast", description: "Add your Charisma modifier to the damage of each Eldritch Blast beam." },
  { id: "armor-of-shadows", name: "Armor of Shadows", description: "Mage Armor on yourself at will, without a spell slot." },
  { id: "ascendant-step", name: "Ascendant Step", level: 9, description: "Levitate on yourself at will." },
  { id: "beast-speech", name: "Beast Speech", description: "Speak with Animals at will." },
  { id: "beguiling-influence", name: "Beguiling Influence", description: "Proficiency in Deception and Persuasion." },
  { id: "bewitching-whispers", name: "Bewitching Whispers", level: 7, description: "Compulsion once per long rest, with a warlock slot." },
  { id: "book-of-ancient-secrets", name: "Book of Ancient Secrets", pact: "tome", description: "Ritual spells written into your Book of Shadows." },
  { id: "chains-of-carceri", name: "Chains of Carceri", level: 15, pact: "chain", description: "Hold Monster at will on a celestial, fiend or elemental." },
  { id: "devils-sight", name: "Devil's Sight", description: "See normally in darkness, even magical darkness, out to 120 feet." },
  { id: "dreadful-word", name: "Dreadful Word", level: 7, description: "Confusion once per long rest, with a warlock slot." },
  { id: "eldritch-sight", name: "Eldritch Sight", description: "Detect Magic at will." },
  { id: "eldritch-spear", name: "Eldritch Spear", cantrip: "eldritch-blast", description: "Eldritch Blast reaches 300 feet." },
  { id: "eyes-of-the-rune-keeper", name: "Eyes of the Rune Keeper", description: "Read any writing." },
  { id: "fiendish-vigor", name: "Fiendish Vigor", description: "False Life on yourself at will, as a 1st-level spell." },
  { id: "gaze-of-two-minds", name: "Gaze of Two Minds", description: "See and hear through a willing humanoid you touch." },
  { id: "lifedrinker", name: "Lifedrinker", level: 12, pact: "blade", description: "Pact weapon hits deal extra necrotic damage equal to your Charisma modifier." },
  { id: "mask-of-many-faces", name: "Mask of Many Faces", description: "Disguise Self at will." },
  { id: "master-of-myriad-forms", name: "Master of Myriad Forms", level: 15, description: "Alter Self at will." },
  { id: "minions-of-chaos", name: "Minions of Chaos", level: 9, description: "Conjure Elemental once per long rest, with a warlock slot." },
  { id: "mire-the-mind", name: "Mire the Mind", level: 5, description: "Slow once per long rest, with a warlock slot." },
  { id: "misty-visions", name: "Misty Visions", description: "Silent Image at will." },
  { id: "one-with-shadows", name: "One with Shadows", level: 5, description: "Become invisible in dim light or darkness until you move or act." },
  { id: "otherworldly-leap", name: "Otherworldly Leap", level: 9, description: "Jump on yourself at will." },
  { id: "repelling-blast", name: "Repelling Blast", cantrip: "eldritch-blast", description: "Each Eldritch Blast beam that hits pushes the creature 10 feet away." },
  { id: "sculptor-of-flesh", name: "Sculptor of Flesh", level: 7, description: "Polymorph once per long rest, with a warlock slot." },
  { id: "sign-of-ill-omen", name: "Sign of Ill Omen", level: 5, description: "Bestow Curse once per long rest, with a warlock slot." },
  { id: "thief-of-five-fates", name: "Thief of Five Fates", description: "Bane once per long rest, with a warlock slot." },
  { id: "thirsting-blade", name: "Thirsting Blade", level: 5, pact: "blade", description: "Attack twice with your pact weapon when you take the Attack action." },
  { id: "visions-of-distant-realms", name: "Visions of Distant Realms", level: 15, description: "Arcane Eye at will." },
  { id: "voice-of-the-chain-master", name: "Voice of the Chain Master", pact: "chain", description: "Speak through your familiar and share its senses at any distance." },
  { id: "whispers-of-the-grave", name: "Whispers of the Grave", level: 9, description: "Speak with Dead at will." },
  { id: "witch-sight", name: "Witch Sight", level: 15, description: "See the true form of shapechangers and illusions within 30 feet." },
];

/** Hunter's Prey (SRD 5.1, the Hunter's 3rd-level choice). */
export const HUNTERS_PREY: LevelOptionData[] = [
  { id: "colossus-slayer", name: "Colossus Slayer", description: "Once a turn, a weapon hit on a creature already hurt deals an extra 1d8 damage." },
  { id: "giant-killer", name: "Giant Killer", description: "A Large or larger creature near you that attacks: your reaction strikes back." },
  { id: "horde-breaker", name: "Horde Breaker", description: "Once a turn, a second weapon attack against another creature next to your target." },
];

/**
 * Circle of the Land (SRD 5.1): the land the druid is bound to, with its circle spells by druid
 * level, always prepared. The terrains are the Ranger's favored terrains.
 */
export const CIRCLE_SPELLS: Record<string, Record<number, readonly string[]>> = {
  arctic: { 3: ["hold-person", "spike-growth"], 5: ["sleet-storm", "slow"], 7: ["freedom-of-movement", "ice-storm"], 9: ["commune-with-nature", "cone-of-cold"] },
  coast: { 3: ["mirror-image", "misty-step"], 5: ["water-breathing", "water-walk"], 7: ["control-water", "freedom-of-movement"], 9: ["conjure-elemental", "scrying"] },
  desert: { 3: ["blur", "silence"], 5: ["create-food-and-water", "protection-from-energy"], 7: ["blight", "hallucinatory-terrain"], 9: ["insect-plague", "wall-of-stone"] },
  forest: { 3: ["barkskin", "spider-climb"], 5: ["call-lightning", "plant-growth"], 7: ["divination", "freedom-of-movement"], 9: ["commune-with-nature", "tree-stride"] },
  grassland: { 3: ["invisibility", "pass-without-trace"], 5: ["daylight", "haste"], 7: ["divination", "freedom-of-movement"], 9: ["dream", "insect-plague"] },
  mountain: { 3: ["spider-climb", "spike-growth"], 5: ["lightning-bolt", "meld-into-stone"], 7: ["stone-shape", "stoneskin"], 9: ["passwall", "wall-of-stone"] },
  swamp: { 3: ["acid-arrow", "darkness"], 5: ["water-walk", "stinking-cloud"], 7: ["freedom-of-movement", "locate-creature"], 9: ["insect-plague", "scrying"] },
  underdark: { 3: ["spider-climb", "web"], 5: ["gaseous-form", "stinking-cloud"], 7: ["greater-invisibility", "stone-shape"], 9: ["cloudkill", "insect-plague"] },
};

/** The Life Domain's spells by cleric level (SRD 5.1), always prepared. */
export const DOMAIN_SPELLS: Record<string, Record<number, readonly string[]>> = {
  life: { 1: ["bless", "cure-wounds"], 3: ["lesser-restoration", "spiritual-weapon"], 5: ["beacon-of-hope", "revivify"], 7: ["death-ward", "guardian-of-faith"], 9: ["mass-cure-wounds", "raise-dead"] },
};

/** The Oath of Devotion's spells by paladin level (SRD 5.1), always prepared. */
export const OATH_SPELLS: Record<string, Record<number, readonly string[]>> = {
  devotion: { 3: ["protection-from-evil-and-good", "sanctuary"], 5: ["lesser-restoration", "zone-of-truth"], 9: ["beacon-of-hope", "dispel-magic"], 13: ["freedom-of-movement", "guardian-of-faith"], 17: ["commune", "flame-strike"] },
};

/** The spells of a by-level table a class level has reached. */
export const spellsUpTo = (table: Record<number, readonly string[]> | undefined, level: number): string[] =>
  Object.entries(table ?? {}).filter(([at]) => Number(at) <= level).flatMap(([, ids]) => [...ids]);

/** SRD 5.1's one feat, taken in place of an Ability Score Improvement. */
export interface FeatData extends LevelOptionData {
  /** A score the feat needs: Grappler needs Strength 13. */
  requires?: { ability: "str" | "dex" | "con" | "int" | "wis" | "cha"; score: number };
}

export const FEATS: FeatData[] = [
  { id: "grappler", name: "Grappler", requires: { ability: "str", score: 13 }, description: "Advantage on attack rolls against a creature you are grappling, and you can try to pin a creature you hold." },
];

/**
 * Picks the level-up screen offers first ("defaults if skipped"), best first. Options not listed come
 * after, in the order they are listed above.
 */
export const LEVEL_UP_SUGGESTIONS = {
  fightingStyle: { paladin: "defense", ranger: "archery" } as Record<string, string>,
  metamagic: ["quickened", "twinned", "careful", "empowered", "extended", "subtle", "distant", "heightened"],
  invocations: ["agonizing-blast", "repelling-blast", "devils-sight", "armor-of-shadows", "thirsting-blade", "fiendish-vigor", "eldritch-sight", "mask-of-many-faces"],
  pactBoon: "tome",
  /** Cantrips from any class for the Pact of the Tome. */
  anyCantrips: ["guidance", "sacred-flame", "fire-bolt", "shillelagh", "vicious-mockery", "light", "mage-hand", "resistance"],
  huntersPrey: "colossus-slayer",
  circleTerrain: "forest",
  /** Skills for Expertise and the College of Lore, most useful first. */
  skills: ["perception", "stealth", "persuasion", "insight", "deception", "athletics", "acrobatics", "investigation", "arcana", "survival", "medicine", "performance", "history", "nature", "religion", "intimidation", "sleight-of-hand", "animal-handling"],
  favoredEnemies: ["undead", "monstrosity", "beast", "fiend", "giant", "dragon", "aberration", "elemental", "fey", "construct", "ooze", "plant", "celestial"],
  /** Magical Secrets: spells from any class, best first. */
  secrets: ["counterspell", "fireball", "revivify", "cure-wounds", "spirit-guardians", "haste", "magic-missile", "shield"],
};
