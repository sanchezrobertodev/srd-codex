import type { Character } from "./character";
import type { Ability, Condition, DamageType } from "./abilities";
import type { Battlefield, Cell, MonsterBehavior } from "./battlefield";
// The game's world file formats live in its world generator, which this repo leaves out; the Codex never reads them.
type CampaignWorldState = { position: object };
type EditOp = unknown;

export interface MonsterInstance {
  /** A warlock's Pact of the Chain familiar (DAG-189): the hero it belongs to. */
  familiarOf?: string;
  form?: string;
  /** Utility trait state is saved across reloads (DAG-119). */
  heardSounds?: string[];
  inventory?: import("./items").InventoryEntry[];
  masterId?: string;
  /** Trait resources persist between combats and across reloads (DAG-119). */
  traitUses?: Record<string, number>;
  /** Scene facts not represented by a condition or a board square. */
  environment?: { submerged?: boolean; smellBlocked?: boolean; noAir?: boolean };
  /** Spell slots spent (by level, "1") and innate uses spent (by spell id), until a long rest (DAG-119). */
  spellUses?: Record<string, number>;
  /** Sizes smaller than its stat block's (an ochre jelly that split, DAG-119). */
  shrunk?: number;
  /** Split off another creature (an ochre jelly's Split): its XP is the original's, not counted again. */
  splitFrom?: string;
  /** The spell the monster concentrates on (DAG-119). */
  concentratingOn?: string;
  /** Breath and Limited Amphibiousness clocks, measured in rounds, including exploration time. */
  breathing?: { held: number; suffocating: number; dry: number };
  /** Chosen bright-light radius; zero extinguishes Ignited Illumination. */
  lightRadius?: number;
  /** False Appearance ends when the creature moves or attacks; observers then know what it is. */
  appearanceRevealed?: boolean;
  instanceId: string;
  monsterId: string;
  /** Display label such as "Goblin 2" */
  label: string;
  hp: number;
  maxHp: number;
  conditions: Condition[];
  /** Grid position while a battlefield is staged (tactical combat only) */
  pos?: Cell;
  behavior?: MonsterBehavior;
  /**
   * A friendly creature fighting alongside the hero (DAG-59): the DM narrates it, so it takes no
   * engine turns, monsters don't attack it, and it doesn't count toward winning a fight.
   */
  ally?: boolean;
  /** Bardic Inspiration this ally holds (DAG-59): the die, until a game time in minutes, and the bard who gave it (DAG-105). */
  inspiration?: { die: number; expiresAt: number; from?: string };
  /** It broke and left the board (DAG-118): out of the fight, counted with the beaten, leaving no body. */
  fled?: boolean;
}

/** What an affliction stops its creature doing (DAG-119): Slowing Breath, Fetid Cloud, Aberrant Ground. */
export interface AfflictionLimits {
  noReactions?: true;
  /** An action or a bonus action on its turn, not both. */
  actionOrBonus?: true;
  /** No more than one attack on its turn. */
  oneAttack?: true;
  halfSpeed?: true;
  speedZero?: true;
  /** It can't breathe (a darkmantle over the head, a rug, an engulfing cube). */
  noAir?: true;
  /** No action or bonus action at all on its turn (Command's "grovel"). */
  noActions?: true;
  /** Disadvantage on its attack rolls and ability checks (Heat Metal's searing). */
  disadvantage?: true;
}

/**
 * A lasting effect a monster's attack, breath or trait put on a creature (DAG-119): a grapple, a
 * poison, a paralysis, an attached stirge, a disease. It owns the conditions it gives (they end with
 * it unless another affliction also gives them), and says how it ends: rounds running out, a repeat
 * save, damage waking the creature, an escape, its source dying or letting go.
 */
export interface Affliction {
  id: string;
  /** The monster (or other creature) that caused it; it may have left the scene since. */
  sourceId: string;
  /** What did it, for the log: "Ghoul 1's Claws". */
  source: string;
  /** The rule: "Claws", "Paralyzing Breath", "Fetid Cloud". */
  name: string;
  targetId: string;
  kind: "condition" | "grapple" | "attach" | "webbing" | "poison-drop" | "petrifying" | "disease" | "curse" | "ignite" | "invisibility" | "enlarge" | "aura" | "immunity" | "spell" | "inside";
  conditions: Condition[];
  /** Rounds left, the clock counting ten to the minute; null lasts until something ends it. */
  roundsLeft: number | null;
  /** Ends at a turn boundary: the start or end of `id`'s turn, after `skip` such boundaries. */
  until?: { id: string; at: "turn-start" | "turn-end"; skip: number };
  /** A repeat save that ends it, at the end (or start) of each of the creature's turns. */
  save?: { ability: Ability; dc: number; at: "turn-end" | "turn-start"; against?: string; disadvantageInSight?: true; spell?: true };
  /** Taking damage ends it, and so does another creature's action to wake it. */
  wakes?: true;
  /** An escape by action: a grapple (Athletics or Acrobatics) or a Strength check. */
  escape?: { dc: number; check: "grapple" | "str"; disadvantage?: true; byOthers?: true; pullDamage?: string };
  /** An action, by the creature or another, ends it with no check (a stirge, a fire to douse). */
  detach?: "anyone" | "self";
  /** Damage or hit-point loss on a schedule; `limit` totals what it may take (a stirge's 10). */
  ongoing?: { dice: string; type: DamageType | "loss"; when: "source-turn-start" | "turn-start" | "turn-end"; limit?: number; taken?: number };
  limits?: AfflictionLimits;
  /** The source's attack tied up holding it ("Constrict"), with the advantage it gets against it. */
  holds?: { action: string; advantage?: true; only?: true };
  /** Disease: the save repeated each day (none: it takes its toll every day), and the hit-point maximum it takes. */
  daily?: { ability?: Ability; dc?: number; dice: string; roundsToNext: number; noHealing?: true };
  /** Held up by the source's concentration (a monster's Invisibility, Darkness Aura): damage may break it. */
  concentration?: true;
  /** Webbing that can be torn by others: its AC and hit points left. */
  webbing?: { ac: number; hp: number };
  /** The event count when it began (a harpy's song begun this turn costs no bonus action yet). */
  since?: number;
  /** When it ends, its creature is immune to it for a day (Horrific Appearance). */
  immuneAfter?: true;
  /** A successful repeat save makes its creature immune to it for a day (Luring Song). */
  immuneOnSave?: true;
  /** Faerie Fire: attacks against it have advantage, and it can't benefit from being invisible. */
  outlined?: true;
  /** Guiding Bolt: the next attack roll against it has advantage, then the mark is spent. */
  marked?: true;
  /** An aura around the source (Spirit Guardians): foes starting a turn in it save or take damage, and are slowed. */
  aura?: { feet: number; dice: string; damageType: DamageType; ability: Ability; dc: number; slows?: true };
  /** Heat Metal: the caster's bonus action burns again each turn; the save to drop the object. */
  heated?: { dice: string; dc: number; itemId?: string };
  /** Divine Eminence: extra radiant dice on the source's melee weapon hits this turn. */
  eminence?: string;
  /** Spiritual Weapon: a bonus-action melee spell attack each turn while it lasts. */
  weapon?: { dice: string; toHit: number; damageType: DamageType };
  /** Turn Undead or Turn the Unholy (DAG-189): it flees the hero, Dashing or Dodging, until damage ends it. */
  turned?: true;
  /** The Grappler feat's pin (DAG-189): the grapple it lasts as long as. */
  pinOf?: string;
  /** Mirror Image (DAG-189): the illusory duplicates left. */
  images?: number;
  /** Meld into Stone (DAG-189): inside the stone, out of reach. */
  melded?: true;
  /** Call Lightning (DAG-189): the storm overhead, for another bolt with an action. */
  storm?: { dice: string; dc: number };
  /** Bane (DAG-189): a d4 off its attack rolls and saving throws. */
  bane?: true;
  /** Slow (DAG-189): -2 to its AC and Dexterity saves (its other limits are in `limits`). */
  slowed?: true;
  /** Bestow Curse (DAG-189): the source's attacks and spells that hit it deal 1d8 necrotic more. */
  cursed?: true;
  /** Petrification's first stage: the save at the end of its next turn decides. */
  next?: { conditions: Condition[]; rounds: number; ability: Ability; dc: number };
}

/** A die a spell adds to a roll (DAG-165): Bless, Guidance, Resistance. */
export interface SpellRollBonus {
  source: string;
  roll: number;
}

/** A spell's effect running on the clock (DAG-163). */
export interface ActiveEffect {
  casterId: string;
  spellId: string;
  targetIds: string[];
  concentration: boolean;
  /**
   * Rounds left (6 seconds each): a fight counts them one by one, the clock ten to the minute
   * (DAG-163 review). Null lasts until dispelled.
   */
  roundsLeft: number | null;
  /** Heroism (DAG-165 review): the temporary hit points it last granted, taken back when it ends. */
  tempHp?: number;
  /** Protection from Energy (DAG-189): the damage type it resists. */
  energy?: DamageType;
}

/**
 * Gear at work on a creature (DAG-166): a torch, lantern or candle it carries alight, antitoxin it
 * drank, alchemist's fire burning on it, oil splashed on it, or caltrops in its foot. Rounds left
 * count as a spell's do; null lasts until something ends it.
 */
export interface ItemEffect {
  itemId: string;
  targetId: string;
  /** Who used the item, when not the creature itself. */
  byId?: string;
  roundsLeft: number | null;
}

/**
 * A readied action (DAG-116): what sets it off, a foe coming within the hero's reach or a foe coming
 * into the hero's view, and what the hero does then as a reaction: a weapon attack or a spell.
 */
export interface ReadiedAction {
  id: string;
  trigger: "reach" | "sight";
  action: { kind: "attack"; weaponId?: string } | { kind: "spell"; spellId: string };
}

export interface Combatant {
  /** Character id or monster instanceId */
  id: string;
  kind: "player" | "monster";
  initiative: number;
}

export interface CombatState {
  treeStrideUsed?: string[];
  /** Preserve an already-previewed monster turn when difficulty changes at a reaction prompt (DAG-122). */
  decisionDifficulty?: GameDifficulty;
  round: number;
  turnIndex: number;
  order: Combatant[];
  /** The current combatant has spent its action this turn (the engine ends the turn automatically). */
  acted?: boolean;
  /** Tactical mode: feet of movement left this turn */
  movementLeft?: number;
  /** Feet moved so far this turn (DAG-168): 10 or more is a run-up for a jump. */
  movedFeet?: number;
  /** Actions beyond the turn's one (Action Surge, DAG-163), spent before it. */
  extraActions?: number;
  bonusUsed?: boolean;
  /** Monster damage traits already used during the current combatant's turn. */
  monsterDamageTraitsUsed?: string[];
  /** Surprise is retained for first-round monster traits; initiative still uses the game's surprise rule. */
  surprisedIds?: string[];
  /** Reckless monsters remain exposed until their next turn starts. */
  recklessIds?: string[];
  /** Actual consecutive movement this turn, for straight-line charge requirements. */
  monsterMoveTrace?: { actorId: string; path: Cell[] };
  /** A hit unlocked a monster's bonus attack; the action is spent only when it is executed. */
  monsterBonusAttack?: { actorId: string; actionName: string; trait: string; targetId?: string; moveFeet?: number };
  /** Monk Martial Arts (DAG-61): the player took the Attack action with an unarmed strike or a monk weapon this turn. */
  martialArtsReady?: boolean;
  /** Extra Attack (DAG-189): attacks left in the Attack action the hero has begun this turn. */
  attacksLeft?: number;
  /** Wild Shape (DAG-190 review): the beast's attacks its Multiattack still owes this action, by name ("Claws"). */
  beastAttacks?: string[];
  /** Once-a-turn features already used this turn (DAG-189), as "heroId:feature" (Colossus Slayer). */
  usedThisTurn?: string[];
  /** Horde Breaker (DAG-189): the hero may attack another creature within 5 feet of the one just attacked. */
  hordeBreaker?: { heroId: string; fromId: string; weaponId?: string };
  /** Two-weapon fighting (DAG-189): the hero attacked with a light weapon and may strike with the other as a bonus action. */
  offHand?: { heroId: string; weaponId: string };
  /** Flurry of Blows (DAG-189): the monk's unarmed strikes left, and the Open Hand Technique each hit applies. */
  flurry?: { heroId: string; left: number; technique?: "prone" | "push" | "reactions" };
  /** Step of the Wind (DAG-189): the monks whose jumps go twice as far this turn. */
  stepOfWind?: string[];
  /** Haste (DAG-189): the hero who still has the hasted action this turn (one weapon attack, Dash, Disengage, Hide or an object). */
  hasted?: string;
  /** Combatant ids that have spent their reaction; cleared when that combatant's turn starts */
  reactionsUsed?: string[];
  /**
   * The Help action on attacks (DAG-106): the next attack by another hero against `targetId` has
   * advantage, until the helper's next turn starts.
   */
  helps?: { by: string; targetId: string }[];
  /** Dodge (DAG-116): who is dodging, until their next turn starts. */
  dodging?: string[];
  /** Disengage (DAG-116): who moves without provoking this turn. */
  disengaged?: string[];
  /** Hide (DAG-116): who is hidden from the foes, with their Stealth total. */
  hidden?: { id: string; stealth: number }[];
  /** Ready (DAG-116): actions held for a trigger, until their hero's next turn starts. */
  readied?: ReadiedAction[];
  /**
   * A monster about to leave heroes' reach (DAG-106): the heroes who could make an opportunity attack,
   * waiting for the player to say which do.
   */
  reactionPrompt?: { moverId: string; heroIds: string[] };
  /** The player's answer for that monster's turn: the heroes who make their opportunity attack. */
  reactWith?: { moverId: string; heroIds: string[] };
  /**
   * Shield (DAG-165): an attack in the monster's coming turn would hit a hero whom Shield's +5 AC would
   * save; the player says who casts it. Each chance is the attack as it would land.
   */
  shieldPrompt?: { moverId: string; chances: ShieldChance[] };
  /** The player's answer for that monster's turn: the heroes who cast Shield when its attack would hit. */
  shieldWith?: { moverId: string; heroIds: string[] };
  /** On a copy of the game only: the Shield chances a monster's turn would give, gathered instead of cast. */
  shieldProbe?: ShieldChance[];
  /** DAG-117: a saved, deterministic action waiting for one reaction at a time. */
  reactionRun?: { action: ReactionAction; decisions: boolean[]; pending?: ReactionChance };
}

export type ReactionKind =
  | "opportunity" | "shield" | "hellish-rebuke" | "readied" | "giant-killer" | "protection" | "cutting-words"
  // The base class features of DAG-190: the rogue's and the monk's.
  | "uncanny-dodge" | "deflect-missiles" | "return-missile" | "slow-fall";
export type ReactionPreference = "always" | "ask" | "never";
export type ReactionAction = { kind: "monster"; actorId: string } | { kind: "move" | "jump"; actorId: string; to: { x: number; y: number } };
export interface ReactionChance {
  heroId: string;
  targetId: string;
  kind: ReactionKind;
  trigger: string;
  label: string;
  detail: string;
}

/** An attack Shield would turn from a hit into a miss (DAG-165). */
export interface ShieldChance {
  heroId: string;
  attackerId: string;
  weapon: string;
  toHit: number;
  ac: number;
}

/**
 * A story world: the setting the model writes when a campaign starts (the only kind before
 * DAG-29, and still the default). Places in it are only names.
 */
export interface World {
  name: string;
  tone: string;
  summary: string;
  region: { name: string; description: string };
  factions: { name: string; description: string; attitude: string }[];
  locations: { name: string; description: string }[];
  hook: string;
  currentLocation: string;
}

export interface StoryWorld extends World {
  kind: "story";
}

/**
 * A generated world (DAG-9) saved in the world store, which the campaign refers to by id and
 * content hash. The game warns instead of loading it if the stored world's hash differs.
 */
export interface GeneratedWorldRef {
  kind: "generated";
  id: string;
  contentHash: string;
  generatorVersion: string;
  /** The world's name when the campaign started, for lists and headers without loading the world. */
  name: string;
  /** The scene's free-text label, as in story worlds (set_scene); where the party is, is `place`. */
  currentLocation: string;
  /** The adventure hook chosen when the campaign started (DAG-37): the site it points at, and what the DM is told. */
  hook?: { site: number; text: string };
}

export type CampaignWorld = StoryWorld | GeneratedWorldRef;

/**
 * Where the party is in a generated world: a hex, and inside it optionally a 100-ft cell, a site
 * (with its level and 5-ft square) and a room of that site.
 */
export type Place = CampaignWorldState["position"] & { room?: number };

/** Overland travel pace (SRD 5.1): slow is 2 miles an hour, normal 3, fast 4. */
export type TravelPace = "slow" | "normal" | "fast";

export interface TravelLog {
  /** Game day (timeMinutes / 1440) the minutes below belong to. */
  day: number;
  /** Minutes travelled on that day: past 8 hours is a forced march. */
  minutes: number;
  /** Minutes travelled since the last encounter check (one every 4 hours of travel). */
  sinceCheck: number;
}

/** A trip under way (DAG-96): where it goes, at what pace, and where it set out from (for turning back). */
export interface Journey {
  goal: number;
  pace: TravelPace;
  from: number;
}

/** A detail the DM made up in play and recorded so the next visit stays consistent (record_lore). */
/**
 * The groups a travel encounter offered the DM (DAG-30, DAG-34), kept until a fight starts or the
 * party moves on. Saves from before DAG-97 may hold one; loading turns it into an offer.
 */
export interface PendingEncounter {
  hex: number;
  candidates: { label: string; xp: number; monsters: { monsterId: string; count: number }[] }[];
  /** A site room whose creatures these are (DAG-32): a won fight clears the room. */
  room?: { site: number; room: number };
}

/** A group of creatures: which, how many, their XP, and a name such as "3 Wolves". */
export interface CreatureGroup {
  label: string;
  xp: number;
  monsters: { monsterId: string; count: number }[];
}

/** What turned the creatures up: travel, a camp at night, a site room, the DM, the rest of a group a board had no room for, a band in the zone (DAG-130), a lair (DAG-137), or an exploration event (DAG-136). */
export type OfferSource = "travel" | "camp" | "room" | "dm" | "rest" | "zone" | "lair" | "event";

/**
 * A lair's creatures in an offer (DAG-137): which lair, which of its parts they are (guards by id,
 * "den", "reserve"), so a won fight marks them beaten, and the reserve that comes running when the
 * alarm is raised later (a failed sneak).
 */
export interface OfferLair {
  key: string;
  name: string;
  parts: string[];
  /** The alarm is up: the lair's reserve is already in the group. */
  alarm?: boolean;
  /** Who comes at the alarm, while it isn't raised yet. */
  reserve?: CreatureGroup;
}

/** The four answers to creatures turning up (DAG-97). */
export type OfferChoice = "fight" | "sneak" | "parley" | "back";

/** How hard a fight would be for the party, by the SRD 5.2.1 XP budgets. */
export type OfferDifficulty = "low" | "moderate" | "high" | "beyond";

/**
 * Creatures turned up (DAG-97): the engine stops and offers the player a fight, sneaking past,
 * parley, or turning back, each with its check shown before the pick. Fights start only from here.
 */
export interface EncounterOffer {
  hex: number;
  source: OfferSource;
  group: CreatureGroup;
  /** A site room whose creatures these are (DAG-32): a won fight clears the room. */
  room?: { site: number; room: number };
  /** A lair's guards, den or reserve (DAG-137): a won fight marks them beaten. */
  lair?: OfferLair;
  /** How far off they are, in feet. */
  distance: number;
  /** Whether they have noticed the party. */
  noticed: boolean;
  difficulty: OfferDifficulty;
  /** Out in a hex: the world square the party stands on, where a fight is cut. */
  party?: [number, number];
  /** Out in a hex: the world square where the creatures were seen, where a fight starts them. */
  at?: [number, number];
  /** At a camp: the creatures came while the party slept, with no one on watch (a fight surprises the party). */
  asleep?: boolean;
  /** Travelling fast (or just unwary), the party saw them late: they were closer than they would have been. */
  seenLate?: boolean;
  /** In a site room too small for them (DAG-180): what the fight there will be like, for the card. */
  cramped?: string;
  /** A band of creatures in the zone (DAG-130) that came to meet the party: answering settles it. */
  band?: string;
  /** Hidden ambushers sprang on a party that hadn't noticed them (DAG-130): a fight surprises the party. */
  ambush?: boolean;
  /** Where turning back takes the party (the hex or room it came from); absent: it withdraws where it is. */
  from?: Place;
  /** The label of `from`, for the place it returns to. */
  fromLabel?: string;
  /** The checks, decided as they turned up. */
  checks: {
    /** Sneaking past: a group Stealth check against their best passive Perception; null once they've noticed the party. */
    sneak: { dc: number } | null;
    /** Parley: the party's face makes a Persuasion or an Intimidation check; null when they can't talk. */
    parley: { persuasion: number; intimidation: number } | null;
    /** Turning back: an Athletics check to get away from faster creatures that have noticed the party; null when it's free. */
    back: { dc: number } | null;
  };
}

/** An exploration event waiting on the player (DAG-136): which, where and when it happened. Its title, text and choices are the event table's. */
export interface ExplorationEvent {
  /** The event's id in the tables (@dnd/data explorationEvents). */
  id: string;
  hex: number;
  /** The game minute it happened. */
  at: number;
}

/**
 * Walking while exploring (DAG-136): the feet walked in all, the feet since the last event, and the
 * latest events with when they happened, so none comes round again too soon.
 */
export interface ExplorationLog {
  feet: number;
  sinceEvent: number;
  recent: { id: string; at: number }[];
}

/** What play has done to a lair (DAG-137). */
export interface LairRecord {
  /** Guards (by id), "den" and "reserve" beaten. */
  beaten: string[];
  /** Cleared and logged: the territory is empty. */
  cleared?: true;
  /** The party knows the territory is there (it walked in, or found the lair). */
  known?: true;
}

/**
 * How a band of creatures lives in the zone (DAG-130): wanderers roam, guards hold a spot, packs
 * roam wider and faster, ambushers wait hidden. Sentries and patrols are a lair's (DAG-137).
 */
export type ZoneBehaviour = "wander" | "guard" | "pack" | "ambush" | "sentry" | "patrol";

/**
 * What a band does about the party (DAG-130): it hasn't noticed it, it closes in, stalks it, flees,
 * holds its ground (a guard beyond its leash), or lets it be (after a parley or the party slipped by).
 */
export type ZoneIntent = "unaware" | "close" | "stalk" | "flee" | "hold" | "calm";

/** A band of creatures out in the party's hex (DAG-130): one group that moves together. */
export interface ZoneBand {
  /** "zb1", "zb2"…: unique within the zone's bands. */
  id: string;
  group: CreatureGroup;
  behaviour: ZoneBehaviour;
  /** The world 5-ft square the band stands on. */
  at: [number, number];
  /** Its spot: the guard post, the ambush, or the middle of where it roams. */
  home: [number, number];
  /** How far from home it roams or chases, in 100-ft cells. */
  leash: number;
  /** A patrol's way, in world squares, walked in a loop (DAG-137). */
  route?: [number, number][];
  /** The route point a patrol heads for next. */
  leg?: number;
  /** Where a roaming band heads now. */
  goal?: [number, number];
  /**
   * Which way it looks (DAG-178), in degrees: 0 east, 90 south (y grows to the south). Where it walks,
   * or a watch it keeps; it sees the party best within its sight cone that way.
   */
  facing: number;
  /** The way a band standing watch (a guard, a sentry, an ambusher) looks out (DAG-178): it sweeps round it. */
  watch?: number;
  intent: ZoneIntent;
  /** It has noticed the party. */
  aware: boolean;
  /** The party has noticed it: only seen bands are shown. */
  seen: boolean;
  /** Its Stealth total while it hides (ambushers, stalkers); absent when it isn't hiding. */
  hidden?: number;
  /** The game minute it began stalking the party. */
  since?: number;
  /** Never dropped for being far from the party (a lair's bands). */
  keep?: boolean;
  /** Who placed it: "roam" for the roaming checks, "lair:<feature id>" for a lair (DAG-137). */
  source?: string;
}

/** The creatures out in the party's hex (DAG-130), rebuilt when the party comes to another hex. */
/**
 * The cells of a zone the party has seen (DAG-179): a box of world cells (its top-left cell and size)
 * and a bit per cell, row by row, as base64. The box grows as more is seen.
 */
export interface ZoneFogRecord {
  at: [number, number];
  size: [number, number];
  bits: string;
}

export interface ZoneCreatures {
  hex: number;
  bands: ZoneBand[];
  /** The number of the next band. */
  next: number;
  /** The game minute of the last roaming encounter check. */
  checked: number;
  /** The zone's own dice stream (the state of its RNG), so what the zone does leaves the game's dice alone. */
  rng: number;
}

/** How an offer was answered (DAG-97). */
export type OfferResult = "fight" | "passed" | "toll" | "turned-back";

export interface LoreNote {
  /** What it is about, such as "settlement:3", "site:12", "faction:1" or a story world's place name. */
  place: string;
  note: string;
  /** Game time when it was recorded. */
  atMinutes: number;
}

export type RollMode = "normal" | "advantage" | "disadvantage";

export type GameEvent =
  | { type: "roll"; label: string; expr: string; rolls: number[]; total: number; mode?: RollMode }
  | { type: "check"; actorId: string; skillOrAbility: string; total: number; dc?: number; success?: boolean; rolls: number[]; mode: RollMode; bonus?: SpellRollBonus[] }
  | { type: "save"; actorId: string; ability: string; total: number; dc: number; success: boolean; rolls: number[]; mode: RollMode; bonus?: SpellRollBonus[] }
  | { type: "attack"; attackerId: string; targetId: string; weapon: string; toHitTotal: number; targetAc: number; hit: boolean; crit: boolean; rolls: number[]; mode: RollMode; bonus?: SpellRollBonus[] }
  /** Sanctuary (DAG-165): a foe's Wisdom save to attack a warded creature; on a failure the attack is lost. */
  | { type: "sanctuary"; attackerId: string; targetId: string; allowed: boolean }
  /** Detect Magic (DAG-165): the auras a hero senses within 30 feet. */
  | { type: "magic-sensed"; actorId: string; auras: string[] }
  | { type: "damage"; targetId: string; amount: number; damageType: string; hpAfter: number; source: string }
  | { type: "heal"; targetId: string; amount: number; hpAfter: number; source: string }
  | { type: "death-save"; actorId: string; roll: number; successes: number; failures: number; outcome: "pending" | "stable" | "dead" | "revived"; bonus?: SpellRollBonus[] }
  | { type: "condition"; targetId: string; condition: Condition; applied: boolean; reason?: string }
  | { type: "spell-cast"; casterId: string; spellId: string; slotLevel: number }
  | { type: "combat-start"; order: Combatant[] }
  | { type: "combat-end"; outcome: "victory" | "fled" | "defeat" }
  /** After a lost fight (DAG-106): the foes took the party's gold and left; an hour on, who woke and who is dead. */
  | {
      type: "defeat";
      goldTaken: number;
      woke: string[];
      dead: string[];
      /** Beasts, swarms and the like care nothing for coin (DAG-171): they lose interest instead. */
      careless?: boolean;
      /** Lost in a site room (DAG-171): the foes hold it, and the party comes to where it stepped in from. */
      fellBackTo?: string;
    }
  /** An SRD group check or save (DAG-107): the party succeeds when at least half its members do. */
  | { type: "group-check"; label: string; passed: number; total: number; success: boolean }
  /** A spell that lasts ended (DAG-163): its time ran out, or its caster's concentration ended. */
  | { type: "effect-ends"; casterId: string; spellId: string; reason: string }
  /** Action Surge (DAG-163): the fighter takes one more action this turn. */
  | { type: "action-surge"; actorId: string }
  /** A hero's class or subclass feature at work (DAG-189): Protection, Horde Breaker, Giant Killer, a Metamagic. */
  | { type: "feature"; actorId: string; feature: string; targetId?: string; detail?: string; /** The feature's effect ends (Sacred Weapon). */ ended?: true }
  /** The party's marching order changed (DAG-107): hero ids, the leader first. */
  | { type: "marching-order"; order: string[] }
  /** A hero the player made joins the party at an inn (DAG-108), at the party's lowest level. */
  | { type: "hero-joins"; heroId: string; name: string; level: number; inn: string }
  /** A hero leaves the party at an inn (DAG-108); their coins and quest items go to the hero `to`. */
  | { type: "hero-leaves"; heroId: string; name: string; to: string; gold: number; items: string[]; inn: string; dead?: boolean }
  /** The Help action (DAG-106): on an attack against `targetId`, or on the next check of `skill` by the hero `targetId`. */
  | { type: "help"; actorId: string; targetId: string; kind: "attack" | "check"; skill?: string }
  | { type: "turn"; combatantId: string; round: number }
  | { type: "rest"; kind: "short" | "long"; hpRestored: number }
  // The hero's id (DAG-105); absent in saves from before the party, where it is the one hero.
  | { type: "item"; action: "gain" | "lose" | "equip" | "unequip"; itemId: string; quantity: number; actorId?: string }
  /** Gear at work on a creature starts or ends (DAG-166): a light lit or out, antitoxin, fire, oil, caltrops. */
  | { type: "item-effect"; itemId: string; targetId: string; action: "start" | "end"; byId?: string; reason?: string }
  /** A hero spreads caltrops or ball bearings on the board (DAG-166): a hazard there now. */
  | { type: "spread"; actorId: string; itemId: string; hazardId: string; area: Cell[] }
  /** A hero opens a pack (DAG-166): its gear is now carried loose. */
  | { type: "unpack"; actorId: string; packId: string }
  /**
   * A hero acts on a thing (DAG-167): a chest opened, unlocked or checked, a trap disarmed or sprung, a
   * body searched, a zone's small find searched (DAG-135). `gold` and `items` are what was found, `lore`
   * what the find tells.
   */
  | { type: "thing"; actorId: string; kind: "chest" | "trap" | "corpse" | "find"; name: string; action: "opened" | "unlocked" | "trap-found" | "no-trap" | "disarmed" | "disarm-failed" | "sprung" | "searched" | "nothing"; gold?: number; items?: string[]; lore?: string }
  /** A standard action taken (DAG-116): Dash, Disengage, Dodge, or Ready (with what it holds). */
  | { type: "standard"; actorId: string; action: "dash" | "disengage" | "dodge" | "ready"; detail?: string }
  /** Hiding (DAG-116): hidden with a Stealth total, or no longer, and why. */
  | { type: "hidden"; actorId: string; hidden: boolean; reason: string; stealth?: number }
  /** A monster's plan for its turn (DAG-118), in words for the log and the narrator: "goes for Elowen: already hurt". */
  | { type: "intent"; actorId: string; targetId?: string; text: string }
  /** A monster that broke leaves the board (DAG-118). */
  | { type: "flees"; actorId: string }
  /** A fight where neither side came to grips for `rounds` rounds peters out (DAG-169): the party moves on. */
  | { type: "stalemate"; rounds: number }
  /** A readied action goes off (DAG-116): its hero reacts to the foe that set it off. */
  | { type: "readied"; actorId: string; targetId: string; trigger: "reach" | "sight" }
  /** A dying hero made stable without a check (DAG-166): a healer's kit. */
  | { type: "stabilize"; actorId: string; targetId: string; source: string }
  /** A hero's meal before a long rest (DAG-166): a ration, the inn's, or nothing (no exhaustion lost). */
  | { type: "meal"; actorId: string; ate: boolean; source?: string }
  | { type: "gold"; delta: number; after: number; actorId?: string }
  /**
   * XP gained. `levelReady` is the level the hero can now take (DAG-183): levelling waits for the
   * player's choices. `leveledTo` is from saves before DAG-183, when the hero levelled at once.
   */
  | { type: "xp"; delta: number; after: number; leveledTo?: number; levelReady?: number; actorId?: string }
  /**
   * A hero takes a level (DAG-183): the hit points it gave (`rolled` when the hit die was rolled, by the
   * house rule) and what the player chose, in short words ("Strength 16 → 18", "Champion").
   */
  | { type: "level-up"; actorId: string; level: number; hpGain: number; rolled?: number; gains: string[] }
  | { type: "time"; minutes: number; totalMinutes: number; /** Why, when it says (DAG-169): "waiting for first light". */ reason?: string }
  /** The party's weather turned (DAG-148); `previous` is null the first time it is set. */
  | { type: "weather"; weather: Weather; previous: WeatherKind | null }
  | { type: "scene"; location: string; description: string }
  | { type: "monster-spawn"; instances: MonsterInstance[] }
  | { type: "narration"; text: string; role: "dm" | "player" }
  // Tactical combat
  | { type: "encounter-start"; title: string; width: number; height: number }
  | { type: "move"; actorId: string; from: Cell; to: Cell; path: Cell[]; feet: number }
  /**
   * A jump on the board (DAG-168): from a square to where it landed, the feet it covered, and, for one
   * that fell short of the square aimed at, that square.
   */
  | { type: "jump"; actorId: string; from: Cell; to: Cell; feet: number; aimed?: Cell }
  /**
   * A climb up or down a face of 10 ft or more on the board (DAG-133): `feet` is the rise (negative
   * going down), `dc` the Strength (Athletics) DC, absent for a creature with a climbing speed.
   */
  | { type: "climb"; actorId: string; from: Cell; to: Cell; feet: number; dc?: number; success: boolean }
  /** A fall on the board (DAG-133): from a square down to another, `feet` dropped. */
  | { type: "fall"; actorId: string; from: Cell; to: Cell; feet: number }
  /** The Shove action (DAG-133): pushed 5 ft away (to `to`) or knocked prone, or resisted. */
  | { type: "shove"; actorId: string; targetId: string; mode: "push" | "prone"; success: boolean; to?: Cell }
  | { type: "trap"; trapId: string; actorId: string; action: "found" | "disarmed" | "triggered" | "disarm-failed" }
  | { type: "hazard"; hazardId: string; actorId: string; when: "enter" | "turn-start" }
  | { type: "speech"; speakerId: string; text: string }
  // Generated worlds: the party moved (DAG-29); `label` says where in words.
  | { type: "place"; place: Place; label: string }
  /** The party walked across its hex's zone (DAG-126): the way taken, corner to corner in world cells. */
  /** Through a settlement's gate (DAG-174), into it or out of it, and the minutes across its streets. */
  | { type: "town-gate"; settlement: number; name: string; gate: string; way: "in" | "out"; minutes: number }
  | { type: "walk"; hex: number; path: [number, number][]; minutes: number; feet: number; label: string; /** Feet of it over steep ground (DAG-134). */ steepFt?: number }
  /** Barbarian Rage starts, or ends and why (DAG-58). */
  | { type: "rage"; actorId: string; active: boolean; reason?: string }
  /** Bardic Inspiration (DAG-59): given to an ally, rolled when it's used (`rolled`), or lapsed. */
  | { type: "inspiration"; actorId: string; targetId: string; die: number; rolled?: number; lapsed?: boolean }
  /** Temporary hit points gained, such as from a warlock's Dark One's Blessing (DAG-65). */
  | { type: "temp-hp"; targetId: string; amount: number; tempHpAfter: number; source: string }
  /** Paladin Divine Sense (DAG-62): the celestials, fiends and undead it found, by type and (on a battlefield) square, never by identity. */
  | { type: "divine-sense"; actorId: string; sensed: { instanceId: string; creatureType: string; at?: Cell; feet?: number }[] }
  /** Dragonborn (DAG-66): the breath weapon, before each creature's save and damage. */
  | { type: "breath-weapon"; actorId: string; damageType: string; shape: "cone" | "line"; save: string; dc: number; targetIds: string[] }
  /** A monster's Recharge roll at the start of its turn (DAG-119): the action is back on `min` or higher. */
  | { type: "recharge"; actorId: string; action: string; roll: number; min: number; recharged: boolean }
  /**
   * A monster's special action (DAG-119): a breath, a spray, a gaze, a cloud. The squares it covered
   * (for the board), the save and DC each creature in it makes, and who was caught.
   */
  | { type: "special"; actorId: string; action: string; area?: Cell[]; shape?: "cone" | "line" | "sphere" | "single" | "self"; save?: Ability; dc?: number; targetIds: string[] }
  /** A lasting effect of a monster's starts or ends (DAG-119): a grapple, a poison, a paralysis. */
  | { type: "affliction"; targetId: string; sourceId: string; name: string; kind: Affliction["kind"]; action: "start" | "end"; conditions: Condition[]; reason?: string }
  /** A hero's metal item eaten away (DAG-119): its penalty now, and whether it is destroyed. */
  | { type: "corrode"; actorId: string; itemId: string; penalty: number; destroyed: boolean; source: string }
  /** A monster's reaction (DAG-119): Parry, Split, Shriek. */
  | { type: "monster-reaction"; actorId: string; reaction: string; targetId?: string; detail?: string }
  /** A drain (DAG-119): a hit-point maximum or an ability score lowered, or given back on a rest or cure. */
  | { type: "drain"; targetId: string; what: "max-hp" | Ability; amount: number; after: number; source: string; restored?: boolean }
  /** Half-Orc (DAG-66): Relentless Endurance leaves the hero at 1 hit point instead of 0. */
  | { type: "relentless-endurance"; actorId: string }
  /** Exhaustion changes (DAG-30): the new level and why (a forced march, a long rest). */
  | { type: "exhaustion"; actorId: string; level: number; reason: string }
  /** Overland travel (DAG-30): the hexes walked, the time it took, and why it stopped. */
  | { type: "travel"; from: number; to: number; path: number[]; minutes: number; pace: TravelPace; label: string; stopped: "arrived" | "encounter" | "check" | "night" | "day" | "exhausted" }
  /** An encounter check while travelling (DAG-30): a d20 at or under `need` means an encounter. */
  | { type: "encounter-check"; hex: number; roll: number; need: number; encounter: boolean }
  /** A door on a square's edge opened, shut, forced or found (DAG-35). */
  | { type: "door"; actorId: string; x: number; y: number; side: "north" | "south" | "east" | "west"; action: "opened" | "closed" | "forced" | "force-failed" | "found" }
  /** A lair's alarm is raised (DAG-137): who raised it, and who comes running. */
  | { type: "lair-alarm"; lair: string; name: string; by: string; joined: string }
  /** The party walks into a lair's territory (DAG-137): signs of it, and the lair's name once known. */
  | { type: "territory"; lair: string; name: string | null; hex: number }
  /** A lair is cleared (DAG-137): its territory is empty now. */
  | { type: "lair-cleared"; lair: string; name: string; hex: number }
  /** A site the party came across (DAG-31): seen while looking around, or found by searching. */
  | { type: "site-found"; siteId: number; name: string; how: "seen" | "search" | "heard" }
  /** A zone feature the party came across (DAG-135): a set piece seen from afar, or a small find seen close by or turned up by searching. */
  | { type: "feature-found"; hex: number; featureId: number; kind: string; name: string; how: "seen" | "search" | "lead" }
  /** Something happened while exploring (DAG-136): an event from the tables, waiting on the player's choice. */
  | { type: "exploration-event"; eventId: string; kind: string; title: string; text: string; hex: number }
  /**
   * How the party dealt with an exploration event (DAG-136): the choice, the check if one was made
   * (its hero's, or a group's tally), and what came of it in words. Gold, items, XP, harm and finds
   * follow as their own events.
   */
  | { type: "event-outcome"; eventId: string; title: string; choice: string; label: string; skill?: string; save?: boolean; total?: number; dc?: number; success?: boolean; group?: [number, number]; actorId?: string; text: string }
  /** The party searched a site room (DAG-95, for the journal): the secret doors it found (by the rooms they lead to) and a trap it spotted. */
  | { type: "room-searched"; siteId: number; room: number; doors: number[]; trap: string | null }
  /** The party searched the land around it for an hour (DAG-98, for the journal): the hidden sites it found. */
  | { type: "area-searched"; hex: number; minutes: number; found: string[] }
  /** The party looked around (DAG-95, for the journal): how far it sees and what, the nearest river and road, the sites in sight. */
  | { type: "look"; sightFeet: number; /** On high ground (DAG-134): feet over the land around. */ riseFt?: number; ground: { name: string; percent: number }[]; river: string | null; road: string | null; settlement: string | null; sites: string[] }
  /** The party entered a site (DAG-32); the host keeps its map in the world store. */
  | { type: "site-entered"; siteId: number; name: string }
  /** The party walks square by square in a site (DAG-139): its route, in world squares, on a level. */
  | { type: "site-walk"; siteId: number; depth: number; path: [number, number][]; minutes: number }
  /** An encounter on the road (DAG-30): 1-3 candidate groups for the DM to choose from. */
  | { type: "encounter"; hex: number; candidates: { label: string; xp: number; monsters: { monsterId: string; count: number }[] }[] }
  /** Creatures turned up and the engine offers the choices (DAG-97). */
  | { type: "offer"; offer: EncounterOffer }
  | { type: "zone-spotted"; band: string; label: string; distance: number; direction: string; intent: ZoneIntent; hidden?: boolean }
  | { type: "zone-band"; band: string; label: string; change: "noticed" | "flees" | "lost" | "stalks" }
  /**
   * A fight opened from the zone (DAG-178): a hero struck first at a band, or a band at the party, with
   * a weapon or a spell (`what`), unseen or not; the opener is resolved before anyone's turn.
   */
  | { type: "strike-first"; side: "party" | "foes"; actorId: string; label: string; what: string; unseen: boolean }
  /** The player answered an offer: how, the check if one was made, and what came of it (DAG-97). */
  | { type: "offer-outcome"; choice: OfferChoice; label: string; result: OfferResult; skill?: string; total?: number; dc?: number; success?: boolean; toll?: number; group?: [number, number] }
  /** A trade at a settlement's market (DAG-100): what, how many, the price paid or got in gp, and the gold after. */
  | { type: "trade"; settlement: number; action: "buy" | "sell"; itemId: string; quantity: number; gp: number; after: number }
  /** A paid service in a settlement (DAG-100): a room at the inn, a drink, a priest's spell. */
  | { type: "service"; settlement: number; service: TownService; label: string; gp: number; after: number }
  /** Something the party heard in a settlement (DAG-100): at the inn, or from a friendly person; a site it names is now known. */
  | { type: "rumour"; settlement: number; from: string; text: string; siteId?: number; /** Told by this person, in their talk. */ person?: string }
  /** A person in a settlement speaks their lines (DAG-100). */
  | { type: "talk"; settlement: number; person: string; name: string; lines: string[] }
  /** A try to win a person over (DAG-100): the attitude before and after its check (the same when it failed). */
  | { type: "attitude"; settlement: number; person: string; name: string; from: Attitude; to: Attitude }
  /** The one haggle a market allows (DAG-100): whether the Persuasion check won better prices. */
  | { type: "haggle"; settlement: number; success: boolean }
  /** A quest taken up, its item found, or done with its reward paid (DAG-101). */
  | { type: "quest"; questId: string; title: string; action: "accepted" | "found" | "done"; reward?: QuestReward };

/** The three quest kinds (DAG-101): beat what holds a site, get somewhere, or fetch an item for someone. */
export type QuestKind = "clear" | "reach" | "bring";
/** Where a quest came from: the campaign's hook, a settlement's notice board, a rumour followed up, or an exploration event (DAG-136). */
export type QuestSource = "hook" | "board" | "rumour" | "event";

/** What a quest pays, from the engine's reward table: the narrator may dress it up but not change it. */
export interface QuestReward {
  gold: number;
  xp: number;
  items: string[];
}

/** A quest in the log (DAG-101). Its progress is worked out from the game state; only `found` and `status` are play's. */
export interface Quest {
  /** "hook", "board:<settlement>:<n>" or "rumour:<settlement>:<n>". */
  id: string;
  kind: QuestKind;
  source: QuestSource;
  title: string;
  text: string;
  /** The site it concerns (clear, bring, and reach a site). */
  site?: number;
  /** reach: the settlement to get to. */
  settlement?: number;
  /** clear: the room whose creatures must be beaten; bring: the room the item lies in. */
  room?: number;
  /** bring: the item to fetch, and who wants it. */
  item?: string;
  giver?: { settlement: number; person?: string; name: string };
  reward: QuestReward;
  status: "active" | "done";
  /** The event count when it was taken up: getting somewhere counts from then. */
  since: number;
  /** bring: the item has been found and taken. */
  found?: boolean;
}

/** How a person feels about the party (SRD 5.2.1): it changes only through checks. */
export type Attitude = "friendly" | "indifferent" | "hostile";

/** The services a settlement sells besides its market (DAG-100). */
export type TownService = "room" | "drink" | "cure-wounds" | "lesser-restoration" | "greater-restoration" | "raise-dead";

/** What play changed in a settlement (DAG-100). The rest of it (people, stock, rumours) comes from the world seed. */
export interface TownRecord {
  /** The market week the trades below belong to (game day / 7): a new week brings fresh stock. */
  week?: number;
  /** Items bought from the market (negative) and sold to it (positive) this week, by item id. */
  traded?: Record<string, number>;
  /** The one haggle allowed here: whether its Persuasion check succeeded. */
  haggled?: boolean;
  /** People whose attitude a check changed, by person id. */
  attitudes?: Record<string, Attitude>;
  /** When a try to influence each person last failed (game minutes): the next waits a day. */
  rebuffed?: Record<string, number>;
  /** The rumours the party has heard here, by index. */
  heard?: number[];
}

/** A foe who fell in a fight out in a zone (DAG-127). */
export interface FallenFoe {
  hex: number;
  /** The creature's id in the fight, so the stage keeps the same figure lying there. */
  instanceId: string;
  monsterId: string;
  label: string;
  /** World square. */
  at: [number, number];
  /** Searched already (DAG-167): what it carried is taken. */
  searched?: true;
}

/**
 * What play has done to a thing in a site (DAG-167): a chest opened or unlocked, its poison needle found
 * or disarmed or sprung, a room's trap disarmed, a body searched. Kept by key: "site:S:room:R:chest:O",
 * "site:S:room:R:trap", "site:S:room:R:corpse:N".
 */
export interface ThingState {
  opened?: true;
  unlocked?: true;
  trapFound?: true;
  disarmed?: true;
  sprung?: true;
  searched?: true;
}

/** Someone the party has talked to in a settlement (DAG-103), and when it first did. */
export interface MetPerson {
  settlement: number;
  /** The person's id in that settlement's roster ("p1"). */
  person: string;
  name: string;
  /** Game minutes when the party first talked to them. */
  at: number;
}

export type GameDifficulty = "story" | "standard" | "hard";

/**
 * The game state, version 6 since DAG-183 (levelling waits for the player's choices; heroes levelled
 * before it are given the choices they missed), version 5 since DAG-110 (shared purse), version 4 since DAG-133 (battlefield heights; version 3 came with DAG-103
 * and DAG-105). Version 1 saves become story-world saves, and version 1 and 2 saves gain the v3 records
 * on load, their one hero becoming a party of one (migrateGameState). Its journal is the event log (`events`), read through the engine's journal
 * lines (DAG-102).
 */
export interface GameState {
  /** Lasting effects of monster attacks, breaths and traits (DAG-119), saved with the game. */
  afflictions?: Affliction[];
  /** Omitted creatures are on the Material Plane (DAG-119). */
  creaturePlanes?: Record<string, string>;
  version: 7;
  /** Campaign difficulty (DAG-122). Saves written before this field use Standard. */
  difficulty?: GameDifficulty;
  /** Saved Quick resolve report; execution resumes only at the player's request (DAG-121). */
  quickResolve?: { from: number; to?: number; dead?: string[]; deadBefore?: string[]; rounds: number; stopped: boolean };
  /** Per-hero reaction choices, saved with the campaign. Missing entries mean Ask (DAG-117). */
  reactionPreferences?: Record<string, Partial<Record<ReactionKind, ReactionPreference>>>;
  /** Shared party gold in gp, counted to the copper piece (DAG-110). */
  gold: number;
  seed: number;
  /** Internal PRNG state (uint32) so a save resumes deterministically */
  rngState: number;
  /**
   * The heroes (DAG-105): 1 to 4, with unique ids, in marching order; the first is the party's
   * leader. Engine functions that act for a hero take its id.
   */
  party: Character[];
  /** The hero the player has selected (DAG-105): who "player" and "self" mean outside a hero's turn in a fight. */
  selectedHeroId: string;
  /**
   * Heroes who left the party at an inn (DAG-108): their ids stay taken, so a later hero never
   * inherits their past events, and the journal still names them.
   */
  formerHeroes?: { id: string; name: string }[];
  /**
   * Spells running on the clock (DAG-163): who cast what on whom, and when it ends. Concentration
   * spells end with the caster's concentration too.
   */
  effects?: ActiveEffect[];
  /** Gear at work on creatures (DAG-166): lights burning, antitoxin, fire, oil, caltrops. */
  itemEffects?: ItemEffect[];
  /** What play has done to things in sites (DAG-167): chests, their needles, rooms' traps, bodies. */
  things?: Record<string, ThingState>;
  world: CampaignWorld;
  /** Where the party is; generated worlds only (null in a story world). */
  place: Place | null;
  /**
   * Overland travel (DAG-30): the game day and the minutes travelled on it (for a forced march), and
   * the minutes since the last encounter check. Absent until the party first travels.
   */
  travel?: TravelLog;
  /** A trip that stopped on the way (DAG-96): at an encounter check, at nightfall or at the day's end. */
  journey?: Journey;
  /** Explored hexes as a base64 bitset (bit i = hex i); empty in a story world. */
  explored: string;
  discoveredSites: number[];
  /** What play changed in the world (a burned village, a cleared room), as world edit operations. The world file never changes. */
  changes: EditOp[];
  lore: LoreNote[];
  /** Creatures that turned up, waiting for the player's answer (DAG-97). */
  offer?: EncounterOffer;
  /** Something that happened while exploring, waiting for the player's choice (DAG-136). */
  event?: ExplorationEvent;
  /** How far the party has walked exploring, for rolling events (DAG-136). Absent until it first walks. */
  exploration?: ExplorationLog;
  /** The creatures out in the party's hex (DAG-130): they roam, notice the party and close in. */
  zoneCreatures?: ZoneCreatures;
  /** How the party walks the zone (DAG-130): slow moves stealthily, fast takes 5 from its passive Perception. Normal when absent. */
  zonePace?: TravelPace;
  /**
   * The zone's fog of war (DAG-179): by hex, the cells the party has seen there, explored for good.
   * Absent in a save written before it: the engine starts it around where the party walked.
   */
  zoneFog?: Record<string, ZoneFogRecord>;
  /**
   * The explored squares of the sites' levels (DAG-139), by "site:depth": a bit per square, row by row,
   * in base64. A save from before it keeps the rooms its party had been in, by "site:rooms" (room ids).
   */
  siteFog?: Record<string, string>;
  /** What play changed in each settlement (DAG-100), by settlement id. */
  towns: Record<string, TownRecord>;
  /** The quest log (DAG-101), in the order taken up. */
  quests: Quest[];
  /** The people the party has talked to (DAG-103), in the order it met them. */
  met: MetPerson[];
  /**
   * The foes who fell in fights out in the zone (DAG-127), where they fell, in world squares, so they
   * still lie there afterwards. The latest few; leaving the hex leaves them behind.
   */
  fallen?: FallenFoe[];
  /**
   * The lairs' guards and dens play has dealt with (DAG-137), by lair key: those beaten for good, and
   * whether it is cleared. Absent: none.
   */
  lairs?: Record<string, LairRecord>;
  /** A lair's creatures being fought (DAG-137), so a victory marks them beaten. */
  lairFight?: { key: string; name?: string; parts: string[] };
  /** The site room being fought over (DAG-32), so a victory records it as cleared. */
  roomFight?: { site: number; room: number; from?: Place; fromLabel?: string };
  monsters: MonsterInstance[];
  combat: CombatState | null;
  /** Present while a tactical encounter is staged */
  battlefield?: Battlefield;
  timeMinutes: number;
  /** The party's weather (DAG-148), kept current by the engine as time passes and the party travels. */
  weather?: Weather;
  /** The climate the weather is worked out for: the party's hex's, from the last move. */
  weatherClimate?: Climate;
  events: GameEvent[];
}

/** Weather the engine works out and the stage draws (DAG-148). Snow comes below freezing. */
export type WeatherKind = "clear" | "cloudy" | "fog" | "rain" | "snow";

export interface Weather {
  kind: WeatherKind;
  /** How strong, 0 to 1 (a drizzle to a downpour). */
  intensity: number;
}

/** A place's climate: mean temperature in °C and rainfall in mm a year (the world's layers). */
export interface Climate {
  temperature: number;
  rainfall: number;
}

export type DayPhase = "dawn" | "day" | "dusk" | "night";

/** The sky at a game time, as the engine works it out from the clock (DAG-148). Angles in degrees. */
export interface SkyState {
  minutes: number;
  /** The hour of the day, 0 to 24. */
  hour: number;
  phase: DayPhase;
  /** Above the horizon when positive. */
  sunElevation: number;
  /** Clockwise from north: east 90 at sunrise, south 180 at noon, west 270 at sunset. */
  sunAzimuth: number;
  moonElevation: number;
  moonAzimuth: number;
  /** 0 new, 0.5 full. */
  moonPhase: number;
  /** How much daylight: 0 at night, 1 by day, eased through dawn and dusk. */
  daylight: number;
}
