import type { AbilityScores, Condition, DamageType, Size } from "./abilities";

export interface MonsterAction {
  name: string;
  description: string;
  usage?: { type: string; dice?: string; min_value?: number; times?: number; rest_types?: string[] };
  /** Parsed attack, if this action is an attack */
  attack?: {
    toHit: number;
    reach?: number;
    range?: { normal: number; long: number };
    damage: { dice: string; type: DamageType }[];
  };
}

/** A trait, reaction or legendary action: a name and its rules text. */
export interface MonsterFeature {
  name: string;
  description: string;
  usage?: MonsterAction["usage"];
}

export interface MonsterData {
  id: string;
  name: string;
  size: Size;
  type: string;
  alignment: string;
  ac: number;
  hp: { average: number; dice: string };
  speed: Record<string, number>;
  abilities: AbilityScores;
  saves: Partial<AbilityScores>;
  skills: Record<string, number>;
  resistances: DamageType[];
  immunities: DamageType[];
  vulnerabilities: DamageType[];
  conditionImmunities: Condition[];
  senses: Record<string, number | string>;
  blindBeyondBlindsight?: boolean;
  languages: string;
  cr: number;
  xp: number;
  spellcasting?: { level?: number; ability: { index: keyof AbilityScores }; dc?: number; modifier?: number; slots?: Record<string, number>; spells: { name: string; level: number; url: string; notes?: string; usage?: { type: string; times?: number } }[] }[];
  traits: MonsterFeature[];
  actions: MonsterAction[];
  /** Reactions, for the creatures that have them (DAG-83). Shown in the Codex; the engine doesn't use them yet. */
  reactions?: MonsterFeature[];
  /**
   * Legendary actions (DAG-83): how many it can take a round, the paragraph that introduces them,
   * and the options. Shown in the Codex; the engine doesn't use them yet.
   */
  legendary?: { uses: number; description: string; actions: MonsterFeature[] };
}
