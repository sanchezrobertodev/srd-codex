// Exploration events (DAG-136, from the DAG-131 report, decisions 3 and 4): the small happenings of
// walking a zone, rolled by distance walked and time of day from tables by biome, wildness,
// alignment and road, weighted like the encounter tables (DAG-33). Each event is a title, a short
// text and choices; a choice is an SRD 5.1 ability check or saving throw (by the hero the player
// picks, or the whole party as a group check), with what comes of success and of failure.
//
// Clean-room note: every event, its text and its numbers are this game's own. Nothing was taken
// from a published adventure, table or book; the checks and DCs follow the SRD 5.1's general
// guidance (DC 10 easy, 15 medium, 20 hard), and the items and conditions are the SRD's.

export type ExplorationEventKind = "travellers" | "merchant" | "tracks" | "weather" | "wounded-animal" | "trap" | "ambush" | "lost-traveller" | "omen";

/** What a choice comes to. Harm (damage, a condition, exhaustion) falls on the hero who made the check, or on each member who failed a group check. */
export interface EventOutcomeDef {
  /** What happens, in a sentence or two. */
  text: string;
  /** Gold to the party's purse, in gp. */
  gold?: number;
  /** Items for the hero who made the check (the first in marching order for a group). */
  items?: readonly string[];
  /** XP for each hero standing. */
  xp?: number;
  /** A line the party learns, kept as the hex's lore. */
  lore?: string;
  /**
   * A lead: the nearest thing of this kind the party hasn't found yet in the hex becomes found, a
   * zone feature (a lair, a small find, a set piece) or a hidden site.
   */
  lead?: "lair" | "find" | "set-piece" | "site";
  /** A quest (DAG-101): see someone ("the lost child") to the nearest settlement. */
  quest?: { escort: string };
  /** Creatures: an encounter offer from the place's table (DAG-97); "unaware" when the party has the jump on them. */
  fight?: "aware" | "unaware";
  /** Damage, as dice ("1d6") and a damage type. */
  damage?: { dice: string; type: string };
  /** Poisoned for an hour (the SRD condition). */
  poisoned?: boolean;
  /** Levels of exhaustion. */
  exhaustion?: number;
  /** Extra time lost, in minutes. */
  minutes?: number;
}

/** One way to deal with an event. Without a check it simply happens (paying `cost` first, when there is one). */
export interface EventChoiceDef {
  id: string;
  label: string;
  /**
   * The check: a skill or ability key ("medicine", "con"), its DC, whether the whole party rolls (an
   * SRD group check: half or more must succeed), and whether it is a saving throw.
   */
  check?: { skill: string; dc: number; group?: boolean; save?: boolean };
  /** Gold the choice costs, in gp (a pedlar's price). */
  cost?: number;
  /** Minutes the try takes, whatever comes of it. */
  minutes?: number;
  success: EventOutcomeDef;
  failure?: EventOutcomeDef;
}

export interface ExplorationEventDef {
  id: string;
  kind: ExplorationEventKind;
  title: string;
  text: string;
  /** Only by day or only by night. */
  when?: "day" | "night";
  /** Only in this weather (DAG-148). */
  weather?: readonly ("clear" | "cloudy" | "fog" | "rain" | "snow")[];
  /** A Fight choice, with the creatures the event hides (preferred leaders from the place's encounter table). */
  fight?: readonly string[];
  choices: readonly EventChoiceDef[];
}

const EVENTS: readonly ExplorationEventDef[] = [
  // Merchants and travellers
  {
    id: "overturned-cart", kind: "merchant", title: "An overturned cart",
    text: "A cart lies on its side across the way, one wheel still turning. A merchant is pinned by a spilled crate, and a mule stamps nearby, trailing its harness.",
    choices: [
      { id: "tend", label: "Tend the merchant", check: { skill: "medicine", dc: 12 }, minutes: 20, success: { text: "The merchant's leg is bruised, not broken. Grateful, they press a few coins on the party.", gold: 5, xp: 25 }, failure: { text: "The merchant groans and waves the party off, limping after the mule.", minutes: 10 } },
      { id: "right", label: "Right the cart", check: { skill: "athletics", dc: 12, group: true }, minutes: 30, success: { text: "Together the party heaves the cart back onto its wheels. The merchant shares food from the load.", items: ["rations-1-day", "rations-1-day"], xp: 25 }, failure: { text: "The cart won't budge, and the party leaves the merchant waiting for help from the road.", minutes: 15 } },
      { id: "tracks", label: "Read the ground", check: { skill: "survival", dc: 13 }, minutes: 10, success: { text: "Hoof scrapes and a snapped trace: something spooked the mule. Its tracks lead off, and the party follows them.", lead: "lair" }, failure: { text: "The ground is trampled to mud; nothing can be read from it." } },
    ],
  },
  {
    id: "pedlar", kind: "merchant", title: "A pedlar on the way",
    text: "A pedlar with a pack taller than they are hails the party, rattling a tray of small goods.",
    choices: [
      { id: "potion", label: "Buy a potion of healing", cost: 50, success: { text: "The pedlar counts the coins twice and hands over a small red vial.", items: ["potion-of-healing"] } },
      { id: "rations", label: "Buy three days of food", cost: 2, success: { text: "Hard bread, cheese and dried meat, wrapped in cloth.", items: ["rations-1-day", "rations-1-day", "rations-1-day"] } },
      { id: "news", label: "Trade news", check: { skill: "persuasion", dc: 12 }, minutes: 15, success: { text: "Warmed by the talk, the pedlar mentions a place off the path that most folk walk past.", lead: "set-piece", lore: "A pedlar says few folk leave the path here, and fewer come back with stories." }, failure: { text: "The pedlar talks prices and nothing else." } },
    ],
  },
  {
    id: "pilgrims", kind: "travellers", title: "Pilgrims at rest", when: "day",
    text: "A handful of pilgrims sit around a cold hearth, sharing a skin of water. Their walking staves are hung with faded ribbons.",
    choices: [
      { id: "pray", label: "Join their prayers", check: { skill: "religion", dc: 12 }, minutes: 20, success: { text: "The party knows the old words, and the pilgrims bless them on their way.", xp: 25, lore: "Pilgrims pass this way to a shrine they will not name to strangers." }, failure: { text: "The words come out wrong; the pilgrims smile politely and pack up." } },
      { id: "ask", label: "Ask what they've seen", check: { skill: "persuasion", dc: 13 }, minutes: 15, success: { text: "An old pilgrim points the way to ruins they passed and did not like.", lead: "site" }, failure: { text: "They keep their own counsel." } },
    ],
  },
  {
    id: "hunters", kind: "travellers", title: "Hunters on the trail",
    text: "Two hunters come out of the brush with a brace of hares, bows unstrung. They eye the party, then nod.",
    choices: [
      { id: "trade", label: "Swap trail talk", check: { skill: "survival", dc: 11 }, minutes: 15, success: { text: "The hunters warn of a place they steer clear of, and mark the way with a scratch in the dirt.", lead: "lair", xp: 10 }, failure: { text: "They find the party green, and say little." } },
      { id: "hare", label: "Buy a hare for the pot", cost: 1, success: { text: "Fresh meat for a night or two.", items: ["rations-1-day", "rations-1-day"] } },
    ],
  },
  {
    id: "caravan-dust", kind: "travellers", title: "Dust on the horizon", when: "day",
    text: "A long smear of dust rises ahead: a caravan of pack animals, its drovers walking alongside with scarves over their faces.",
    choices: [
      { id: "water", label: "Ask for water and news", check: { skill: "persuasion", dc: 12 }, minutes: 20, success: { text: "The drovers share water and tell of the country ahead.", items: ["waterskin"], lore: "Caravan drovers say the wells this way are few and some are spoiled." }, failure: { text: "The drovers wave the party away from the animals and press on." } },
      { id: "guard", label: "Walk with them a while", check: { skill: "perception", dc: 12, group: true }, minutes: 45, success: { text: "Keeping watch with the drovers, the party spots a hidden cache by the trail. The caravan master pays for the help.", gold: 10, lead: "find" }, failure: { text: "An uneventful hour beside the caravan, and dust in every pocket." } },
    ],
  },
  // Tracks
  {
    id: "fresh-tracks", kind: "tracks", title: "Fresh tracks",
    text: "The ground is churned with prints, some no older than this morning. Whatever made them came this way in numbers.",
    choices: [
      { id: "follow", label: "Follow them", check: { skill: "survival", dc: 13 }, minutes: 30, success: { text: "The party follows the prints a good long way.", lead: "lair", xp: 25 }, failure: { text: "The trail goes cold on stony ground after half an hour.", minutes: 15 } },
      { id: "read", label: "Work out what made them", check: { skill: "nature", dc: 12 }, success: { text: "The party knows the prints and what they mean for the land about.", xp: 10, lore: "Fresh prints of many creatures cross the land here." }, failure: { text: "They could be anything with feet." } },
    ],
  },
  {
    id: "drag-marks", kind: "tracks", title: "Drag marks", fight: ["wolf", "boar", "giant-spider", "goblin", "gnoll", "hyena", "orc", "lion", "kobold"],
    text: "A furrow in the earth, darkened with old blood, as if something heavy was hauled off this way.",
    choices: [
      { id: "stalk", label: "Stalk whatever did it", check: { skill: "stealth", dc: 13, group: true }, minutes: 20, success: { text: "The party creeps up on the creatures at their kill.", fight: "unaware" }, failure: { text: "A snapped branch, and the creatures look up from their kill.", fight: "aware" } },
      { id: "study", label: "Look closer", check: { skill: "investigation", dc: 12 }, success: { text: "Among the marks lies a dropped pouch.", gold: 3 }, failure: { text: "Nothing but blood and churned earth." } },
    ],
  },
  // Weather
  {
    id: "downpour", kind: "weather", title: "A downpour", weather: ["rain"],
    text: "The rain comes down in sheets. Paths turn to streams, and the party can barely see a stone's throw ahead.",
    choices: [
      { id: "shelter", label: "Find shelter", check: { skill: "survival", dc: 12 }, success: { text: "An overhang keeps the worst off, and the party waits it out.", minutes: 30 }, failure: { text: "No shelter turns up, and the party loses an hour slogging through the mud.", minutes: 60 } },
      { id: "push", label: "Push on through it", check: { skill: "con", dc: 10, group: true, save: true }, success: { text: "Soaked through, the party pushes on without losing time." }, failure: { text: "Chilled to the bone, those who faltered are worn down by it.", exhaustion: 1 } },
    ],
  },
  {
    id: "fog-bank", kind: "weather", title: "A wall of fog", weather: ["fog"],
    text: "Fog rolls in thick and white. Sounds carry strangely, and every tree looks like every other.",
    choices: [
      { id: "steer", label: "Keep the way", check: { skill: "survival", dc: 13 }, success: { text: "The party keeps its bearings by the slope of the ground." }, failure: { text: "The party walks in a circle for an hour before the fog thins.", minutes: 60 } },
      { id: "listen", label: "Stop and listen", check: { skill: "perception", dc: 13 }, minutes: 15, success: { text: "Somewhere close, the sound of running water and a bell: a place someone tends.", lead: "set-piece" }, failure: { text: "Only the drip of water from the leaves." } },
    ],
  },
  {
    id: "snow-drifts", kind: "weather", title: "Deep drifts", weather: ["snow"],
    text: "Snow has drifted waist-deep across the way, crusted on top and soft beneath.",
    choices: [
      { id: "break", label: "Break a trail", check: { skill: "athletics", dc: 12, group: true }, minutes: 30, success: { text: "Taking turns at the front, the party ploughs through." }, failure: { text: "The cold and the labour take their toll on those who struggled.", exhaustion: 1 } },
      { id: "round", label: "Find a way round", check: { skill: "survival", dc: 13 }, success: { text: "A windswept ridge offers a way round the worst of it.", minutes: 20 }, failure: { text: "The way round is long.", minutes: 60 } },
    ],
  },
  {
    id: "noon-heat", kind: "weather", title: "The heat of the day", when: "day", weather: ["clear"],
    text: "The sun beats down with no shade in sight. The air shimmers, and every step is heavier than the last.",
    choices: [
      { id: "rest", label: "Rest in what shade there is", check: { skill: "survival", dc: 11 }, success: { text: "A rocky hollow offers shade until the worst passes.", minutes: 60 }, failure: { text: "There is no real shade; the party loses two hours waiting out the heat.", minutes: 120 } },
      { id: "push", label: "Press on", check: { skill: "con", dc: 12, group: true, save: true }, success: { text: "Parched but steady, the party presses on." }, failure: { text: "The heat saps the strength of those who wilted.", exhaustion: 1 } },
    ],
  },
  // Wounded animals
  {
    id: "snared-deer", kind: "wounded-animal", title: "A snared deer",
    text: "A young deer thrashes in a wire snare, its foreleg bloody. It freezes when it sees the party.",
    choices: [
      { id: "calm", label: "Calm it and free it", check: { skill: "animal-handling", dc: 13 }, minutes: 10, success: { text: "Soft words and steady hands; the deer bounds away. The snare's wire is good and is kept.", items: ["hunting-trap"], xp: 25 }, failure: { text: "The deer kicks out in panic before it tears free.", damage: { dice: "1d4", type: "bludgeoning" } } },
      { id: "trapper", label: "Find who set it", check: { skill: "survival", dc: 12 }, minutes: 20, success: { text: "The trapper's line leads to their stand, and what they keep there.", lead: "find" }, failure: { text: "The trapper covers their tracks well." } },
    ],
  },
  {
    id: "arrow-wolf", kind: "wounded-animal", title: "A wounded wolf",
    text: "A lone wolf lies in the grass with a broken arrow in its flank. It bares its teeth, too weak to rise.",
    choices: [
      { id: "heal", label: "Draw the arrow", check: { skill: "medicine", dc: 14 }, minutes: 15, success: { text: "The arrow comes out clean. The wolf limps off, and looks back once.", xp: 50 }, failure: { text: "The wolf snaps as the shaft twists.", damage: { dice: "1d6", type: "piercing" } } },
      { id: "arrow", label: "Study the arrow", check: { skill: "investigation", dc: 12 }, success: { text: "Crude fletching, and the head is filed from scrap: someone lives rough nearby.", lead: "lair", lore: "Someone nearby shoots crude scrap-iron arrows." }, failure: { text: "Just an arrow." } },
    ],
  },
  // Traps
  {
    id: "tripwire", kind: "trap", title: "A trip line",
    text: "A thin cord runs across the way at ankle height, half hidden in the grass. It leads to a bent sapling, held back by a peg.",
    choices: [
      { id: "disarm", label: "Disarm it", check: { skill: "sleight-of-hand", dc: 13 }, success: { text: "The peg comes free gently, and the sapling eases back. A set of caltrops was hung in its branches.", items: ["caltrops"], xp: 25 }, failure: { text: "The sapling whips up, flinging a bag of sharp iron across the path.", damage: { dice: "1d6", type: "piercing" } } },
      { id: "maker", label: "Look for who set it", check: { skill: "investigation", dc: 13 }, success: { text: "Small, careful knots, and a well-worn path beyond. The party follows it.", lead: "lair" }, failure: { text: "The trap-maker left nothing else behind." } },
    ],
  },
  {
    id: "staked-pit", kind: "trap", title: "An old pit",
    text: "Rotten branches cover a pit lined with sharpened stakes. At the bottom, among the stakes, lie old bones and a rusted pack.",
    choices: [
      { id: "climb", label: "Climb down for the pack", check: { skill: "athletics", dc: 12 }, minutes: 15, success: { text: "Careful hands and footholds; the pack holds coins and a coil of rope.", gold: 8, items: ["rope-hempen-50-feet"] }, failure: { text: "A handhold gives way, and the stakes are waiting.", damage: { dice: "1d6", type: "piercing" }, gold: 8 } },
      { id: "mark", label: "Mark it and move on", success: { text: "The party stacks stones beside the pit to warn the next traveller.", xp: 10 } },
    ],
  },
  {
    id: "thorn-needle", kind: "trap", title: "A strongbox in the roots",
    text: "A small iron box is wedged among tree roots, its lid shut. A dark smear stains the clasp.",
    choices: [
      { id: "open", label: "Open it carefully", check: { skill: "thieves-tools", dc: 13 }, minutes: 10, success: { text: "A needle on the clasp, easily wedged. Inside: coins and a vial.", gold: 12, items: ["antitoxin-vial"], xp: 25 }, failure: { text: "The needle bites. Poison burns in the hero's hand, but the box is open.", poisoned: true, gold: 12 } },
      { id: "smash", label: "Smash it open", check: { skill: "athletics", dc: 14 }, success: { text: "The lid gives under a heavy rock. The vial inside shatters, but the coins don't.", gold: 12 }, failure: { text: "The box won't break, and the party leaves it." } },
    ],
  },
  // Ambush set-ups
  {
    id: "felled-tree", kind: "ambush", title: "A felled tree", fight: ["bandit", "goblin", "orc", "kobold", "gnoll", "hobgoblin", "thug", "tribal-warrior", "bugbear"],
    text: "A tree lies across the way, its stump fresh and axe-cut. It's quiet. Too quiet: no birds sing nearby.",
    choices: [
      { id: "spot", label: "Look for watchers", check: { skill: "perception", dc: 14 }, success: { text: "A glint in the brush: the ambushers are spotted before they move.", fight: "unaware" }, failure: { text: "The brush comes alive with figures before anyone sees them.", fight: "aware" } },
      { id: "round", label: "Slip round through the brush", check: { skill: "stealth", dc: 12, group: true }, minutes: 20, success: { text: "The party slips round the ambush and leaves it waiting.", xp: 25 }, failure: { text: "A shout goes up: the party has been seen.", fight: "aware" } },
    ],
  },
  {
    id: "false-camp", kind: "ambush", title: "A smoking campfire", when: "night", fight: ["bandit", "goblin", "orc", "gnoll", "hobgoblin", "thug", "bugbear", "kobold"],
    text: "A small fire burns in a clearing, a pot hanging over it. Nobody sits by it, though bedrolls are laid out.",
    choices: [
      { id: "watch", label: "Watch from the dark", check: { skill: "perception", dc: 13, group: true }, minutes: 15, success: { text: "Shapes wait in the dark beyond the firelight. The party sees them first.", fight: "unaware" }, failure: { text: "The party steps into the firelight, and the trap springs.", fight: "aware" } },
      { id: "insight", label: "Think it through", check: { skill: "insight", dc: 12 }, success: { text: "The bedrolls are stuffed with grass: a lure. The party backs off quietly.", xp: 25 }, failure: { text: "It's a camp, and it's empty. The party walks on, uneasy." } },
    ],
  },
  // Lost travellers
  {
    id: "lost-child", kind: "lost-traveller", title: "A lost child", when: "day",
    text: "A child sits on a stone, red-eyed from crying. They were gathering firewood and wandered too far.",
    choices: [
      { id: "home", label: "Offer to take them home", check: { skill: "persuasion", dc: 10 }, success: { text: "The child takes a hand and points the way home, a long walk off.", quest: { escort: "the lost child" } }, failure: { text: "The child runs off into the trees, and is gone." } },
      { id: "way", label: "Show them the way", check: { skill: "survival", dc: 12 }, minutes: 15, success: { text: "From a rise the party points out the smoke of home, and the child sets off at a run.", xp: 25 }, failure: { text: "The party can't tell where home is from here." } },
    ],
  },
  {
    id: "hurt-scout", kind: "lost-traveller", title: "A hurt scout",
    text: "A scout in a muddy cloak leans against a tree, a rag knotted round one leg. They lost their bearings and their horse.",
    choices: [
      { id: "bind", label: "Bind the wound", check: { skill: "medicine", dc: 12 }, minutes: 20, success: { text: "With the leg bound, the scout shares what they scouted.", lead: "site", xp: 25 }, failure: { text: "The wound is past the party's skill; the scout hobbles off to find help." } },
      { id: "escort", label: "See them to safety", check: { skill: "persuasion", dc: 11 }, success: { text: "The scout will pay to be seen to the nearest settlement.", quest: { escort: "the scout" } }, failure: { text: "The scout trusts nobody, and limps on alone." } },
    ],
  },
  // Omens
  {
    id: "silent-crows", kind: "omen", title: "Silent crows",
    text: "A flock of crows settles in a dead tree all at once and falls utterly silent, every head turned the same way.",
    choices: [
      { id: "read", label: "Read the omen", check: { skill: "religion", dc: 13 }, success: { text: "They watch a place of old power. The party knows the sign, and where it points.", lead: "set-piece", xp: 25, lore: "Crows gather silent over the land here, watching something." }, failure: { text: "The crows take off as one, and the meaning goes with them." } },
      { id: "follow", label: "Look where they look", check: { skill: "perception", dc: 12 }, success: { text: "Half hidden in the land, something the party hadn't seen.", lead: "find" }, failure: { text: "Nothing but empty land." } },
    ],
  },
  {
    id: "pale-lights", kind: "omen", title: "Pale lights", when: "night",
    text: "Pale lights drift between the trees, bobbing like lanterns carried by no one. They seem to beckon.",
    choices: [
      { id: "know", label: "Recall the lore", check: { skill: "arcana", dc: 14 }, success: { text: "Lights like these gather where the dead were left unburied. The party marks the place and keeps away.", lore: "Pale lights drift here at night, over unquiet ground.", xp: 50 }, failure: { text: "The lights fade, leaving an itch at the back of the mind." } },
      { id: "follow", label: "Follow the lights", check: { skill: "wis", dc: 12, group: true, save: true }, minutes: 30, success: { text: "Keeping their wits, the party follows the lights to a place they lead to, then turns away.", lead: "site" }, failure: { text: "The lights lead the party astray; it is an hour before anyone knows where they are.", minutes: 60 } },
    ],
  },
  {
    id: "blighted-carcass", kind: "omen", title: "A blighted carcass",
    text: "A dead elk lies in a ring of withered grass. Its hide is grey and the flies won't touch it.",
    choices: [
      { id: "examine", label: "Examine it", check: { skill: "medicine", dc: 12 }, minutes: 10, success: { text: "No wound, no sickness the party knows: the land itself killed it. Best not linger.", lore: "Beasts die here of no wound, in rings of withered grass.", xp: 25 }, failure: { text: "A breath of the carcass's stench turns the stomach.", poisoned: true } },
      { id: "burn", label: "Burn it", check: { skill: "survival", dc: 11 }, minutes: 20, success: { text: "The fire catches, and the grey smoke goes straight up.", xp: 10 }, failure: { text: "The damp carcass won't burn." } },
    ],
  },
  {
    id: "clear-spring", kind: "omen", title: "A clear spring",
    text: "A spring wells up between mossy stones, the water bright and cold. Someone has left a carved cup on the rim.",
    choices: [
      { id: "drink", label: "Drink and give thanks", check: { skill: "religion", dc: 11 }, minutes: 10, success: { text: "The water is sweet, and the party feels watched over. Beneath the cup, an offering left by others.", gold: 2, xp: 25, lore: "A blessed spring wells up here; travellers leave offerings by it." }, failure: { text: "Cold, clear water, and nothing more." } },
      { id: "herbs", label: "Look for herbs", check: { skill: "nature", dc: 12 }, minutes: 20, success: { text: "Healing herbs grow thick around the stones.", items: ["potion-of-healing"] }, failure: { text: "Moss and cress, nothing useful." } },
    ],
  },
];

/** Every event by id. */
export const EXPLORATION_EVENTS: ReadonlyMap<string, ExplorationEventDef> = new Map(EVENTS.map((e) => [e.id, e]));

/** A weighted table row: an event and its relative chance (whole numbers). */
export interface EventTableRow {
  eventId: string;
  weight: number;
}
const r = (...rows: [string, number][]): readonly EventTableRow[] => rows.map(([eventId, weight]) => ({ eventId, weight }));

/** Everywhere: the weather (only in its weather) and the common happenings. */
export const GENERAL_EVENTS = r(["downpour", 4], ["fog-bank", 4], ["snow-drifts", 4], ["fresh-tracks", 2], ["silent-crows", 1], ["tripwire", 1]);

/** By the world's biome key (worldgen BIOMES). */
export const BIOME_EVENTS: Record<string, readonly EventTableRow[]> = {
  ice: r(["snow-drifts", 4], ["fresh-tracks", 2], ["arrow-wolf", 1], ["hurt-scout", 1]),
  tundra: r(["snow-drifts", 3], ["fresh-tracks", 2], ["drag-marks", 2], ["arrow-wolf", 2], ["hunters", 1]),
  taiga: r(["fresh-tracks", 3], ["drag-marks", 2], ["arrow-wolf", 2], ["snared-deer", 2], ["hunters", 2], ["felled-tree", 1]),
  "temperate-forest": r(["snared-deer", 3], ["felled-tree", 2], ["tripwire", 2], ["staked-pit", 1], ["hunters", 2], ["pale-lights", 2], ["clear-spring", 1], ["drag-marks", 2]),
  woodland: r(["snared-deer", 2], ["hunters", 2], ["pilgrims", 1], ["lost-child", 2], ["clear-spring", 2], ["tripwire", 1], ["felled-tree", 1]),
  steppe: r(["caravan-dust", 3], ["drag-marks", 2], ["fresh-tracks", 2], ["noon-heat", 2], ["hurt-scout", 1]),
  jungle: r(["staked-pit", 2], ["tripwire", 2], ["drag-marks", 2], ["pale-lights", 1], ["thorn-needle", 2], ["clear-spring", 1]),
  savanna: r(["caravan-dust", 2], ["noon-heat", 3], ["drag-marks", 3], ["hunters", 1]),
  desert: r(["noon-heat", 5], ["caravan-dust", 3], ["staked-pit", 1], ["hurt-scout", 1]),
};

/** By the `wild` layer: calm land sees more folk, untamed land more danger. */
export const WILDNESS_EVENTS: Record<"calm" | "wild" | "untamed", readonly EventTableRow[]> = {
  calm: r(["pedlar", 3], ["pilgrims", 3], ["lost-child", 3], ["overturned-cart", 2], ["hunters", 1]),
  wild: r(["overturned-cart", 2], ["hurt-scout", 2], ["felled-tree", 2], ["false-camp", 2], ["tripwire", 2], ["thorn-needle", 1], ["staked-pit", 1]),
  untamed: r(["felled-tree", 2], ["false-camp", 2], ["drag-marks", 3], ["staked-pit", 2], ["hurt-scout", 1], ["silent-crows", 2]),
};

/** By the `alignment` layer. */
export const ALIGNMENT_EVENTS: Record<"blighted" | "neutral" | "blessed", readonly EventTableRow[]> = {
  blighted: r(["blighted-carcass", 4], ["pale-lights", 3], ["silent-crows", 2]),
  neutral: [],
  blessed: r(["clear-spring", 4], ["pilgrims", 2], ["snared-deer", 1]),
};

/** On a road: carts, pedlars and pilgrims; off it, nothing extra. */
export const ROAD_EVENTS = r(["overturned-cart", 4], ["pedlar", 4], ["pilgrims", 2], ["caravan-dust", 1], ["felled-tree", 1]);
