import type { Ability, Condition, DamageType } from "./abilities";
import type { AfflictionLimits } from "./game";

/** A grid square. One square is 5 feet. Origin is the top-left corner. */
export interface Cell {
  x: number;
  y: number;
}

export type TerrainKind = "floor" | "wall" | "difficult" | "water" | "pit" | "lowCover" | "highCover";

export type CoverKind = "none" | "half" | "threeQuarters";

/**
 * What stands on the edge between two squares (DAG-35): nothing, a thin wall, a door (closed or
 * open), a locked door, a secret door (a wall until found) or a window (blocks movement, not sight;
 * half cover through it).
 */
export type EdgeKind = "open" | "wall" | "door" | "openDoor" | "locked" | "secret" | "window";

/** The side of a square an edge lies on. */
export type EdgeSide = "north" | "south" | "east" | "west";

/**
 * Thin walls and doors on square edges. `h` holds the edges above each square row by row, width x
 * (height + 1) (index y * width + x is the edge above square x,y); `v` holds the edges left of each
 * square, (width + 1) x height (index y * (width + 1) + x is the edge left of square x,y).
 */
export interface EdgeLayers {
  h: EdgeKind[];
  v: EdgeKind[];
}

export interface Prop {
  /** Established material and living-tree facts for monster traits (DAG-119). */
  ferrous?: boolean;
  tree?: { living: boolean; size: "small" | "medium" | "large" | "huge" | "gargantuan" };
  id: string;
  name: string;
  x: number;
  y: number;
  blocksMovement: boolean;
  cover: CoverKind;
  hp?: number;
}

export interface TrapData {
  id: string;
  x: number;
  y: number;
  name: string;
  hidden: boolean;
  /** Passive or active Perception needed to notice it */
  detectDc: number;
  /** Sleight of Hand (thieves' tools) needed to disarm it */
  disarmDc: number;
  /** "step": fires when a creature enters the square. "proximity": fires when a creature ends a move within 5 feet. */
  trigger: "step" | "proximity";
  save: { ability: Ability; dc: number };
  damage: { dice: string; type: DamageType };
  /** Runtime flags, false when the encounter is staged */
  detected: boolean;
  disarmed: boolean;
  triggered: boolean;
}

export interface HazardEffect {
  damage?: { dice: string; type: DamageType };
  /** Half damage on a successful save */
  save?: { ability: Ability; dc: number };
  /**
   * Gear spread on the ground (DAG-166): what a failed save does. The damage, if any, then lands only
   * on a failure: caltrops stop the creature and slow it, ball bearings knock it prone.
   */
  onFail?: {
    stop?: boolean;
    prone?: boolean;
    slow?: boolean;
    /** A monster's cloud (DAG-119, a dretch's Fetid Cloud): conditions and limits until the start of its next turn. */
    affliction?: { name: string; sourceId: string; conditions: Condition[]; limits?: AfflictionLimits };
    /** Web (DAG-189): restrained until it escapes, a Strength check against the DC. */
    restrain?: { dc: number; name: string; sourceId: string };
  };
}

export interface HazardData {
  id: string;
  name: string;
  area: Cell[];
  description: string;
  onEnter?: HazardEffect;
  onTurnStart?: HazardEffect;
  /** Gear a hero spread there (DAG-166): caltrops, ball bearings. It springs once per move. */
  itemId?: string;
  /** A monster's cloud (DAG-119): who made it, and the rounds it lasts (it disperses at 0). */
  sourceId?: string;
  roundsLeft?: number;
  /** Lightly obscured (a dretch's gas) or heavily obscured (an octopus's ink): heavy blocks sight into and through it. */
  obscures?: "light" | "heavy";
  /** Magical darkness (the Darkness spell): darkvision can't see through it. */
  darkness?: true;
  /** The spell that made it (Darkness, Fog Cloud): it ends with its caster's concentration. */
  spellId?: string;
  /** It moves with a creature (a darkmantle's Darkness Aura, a mouther's Aberrant Ground), `radius` feet around it. */
  followsId?: string;
  radius?: number;
  /** It lasts while this affliction does (the aura that holds it up). */
  heldBy?: string;
  /** Difficult terrain while it lasts (Aberrant Ground). */
  difficult?: true;
  /** Plant Growth (DAG-189): each foot moved costs this many. */
  costFactor?: number;
  /** Silence (DAG-189): no sound, and no spell with words cast inside. */
  silence?: true;
  /** Daylight (DAG-189): light from a point, bright and dim feet around it. */
  light?: { at: Cell; bright: number; dim: number };
}

export type Lighting = "bright" | "dim" | "dark";

/** Explicit scene facts for monster traits (DAG-119); bright light alone is not sunlight. */
export interface BattlefieldEnvironment {
  sunlight?: boolean;
  shade?: Cell[];
  submerged?: Cell[];
  rocky?: Cell[];
  magicalDarkness?: Cell[];
  /** Each array is one connected web; a creature must touch that same web to sense others. */
  webs?: Cell[][];
  /** Deliberate openings through otherwise blocking squares, measured in inches. */
  openings?: (Cell & { inches: number; fitsTinyCreature?: boolean })[];
}

/** The staged battlefield. Lives on GameState while tactical combat is active. */
export interface Battlefield {
  environment?: BattlefieldEnvironment;
  title: string;
  width: number;
  height: number;
  /** Row-major, length width * height */
  terrain: TerrainKind[];
  lighting: Lighting;
  props: Prop[];
  traps: TrapData[];
  hazards: HazardData[];
  /** Thin walls and doors between squares (DAG-35); absent when every edge is open. */
  edges?: EdgeLayers;
  /**
   * The ground's height of each square in feet, in 5-ft steps, row-major (DAG-133): the zone's
   * landforms under a board cut out in a hex. Absent on a flat board: a site's level, a fight the DM
   * staged, or a board from a save made before heights.
   */
  heights?: number[];
  /**
   * A battlefield cut from a generated site's level: which one, and the offset from board squares
   * to the level's own squares, so a door forced or found here is kept in the campaign (DAG-35); and
   * the world square of the board's corner (DAG-139), so the party is left where the fight ended.
   * Boards saved before DAG-139 have no origin: the party stays where it stood.
   */
  site?: { site: number; depth: number; offset: Cell; origin?: Cell };
  /**
   * A battlefield cut out in a generated world's hex (DAG-127): the hex, and the world square of the
   * board's top-left, so the board stands in the zone where the party is, and the party is back there
   * after the fight. `groundFt` is the zone's ground in feet where the board's heights are 0 (DAG-133).
   */
  world?: { hex: number; origin: Cell; groundFt?: number };
  objective?: EncounterObjective;
}

export type MonsterBehavior = "aggressive" | "defensive" | "ranged" | "guard";

export interface EncounterObjective {
  type: "defeat" | "escape" | "protect" | "survive";
  target?: string;
  rounds?: number;
}

/**
 * The generation contract: what the Dungeon Master (or a fixture) hands the engine to stage a fight.
 * Everything not listed as a terrain cell is floor. Validated by `validateEncounter` before staging.
 */
export interface Encounter {
  environment?: BattlefieldEnvironment;
  title: string;
  narrativeSetup: string;
  grid: { width: number; height: number };
  lighting: Lighting;
  terrain: { x: number; y: number; kind: TerrainKind }[];
  props: Omit<Prop, "id">[];
  traps: Omit<TrapData, "id" | "detected" | "disarmed" | "triggered">[];
  hazards: Omit<HazardData, "id">[];
  /** Thin walls, doors and windows on square edges (DAG-35); only the edges that aren't open. */
  edges?: { x: number; y: number; side: EdgeSide; kind: EdgeKind }[];
  /** The ground's height of each square in feet, in 5-ft steps, row-major (DAG-133); flat when absent. */
  heights?: number[];
  player: Cell;
  monsters: { monsterId: string; x: number; y: number; label?: string; behavior: MonsterBehavior; ally?: boolean }[];
  objective?: EncounterObjective;
}
