import type { Ability, DamageType } from "./abilities";

export type SpellSchool =
  | "abjuration"
  | "conjuration"
  | "divination"
  | "enchantment"
  | "evocation"
  | "illusion"
  | "necromancy"
  | "transmutation";

/** Mechanical effect the engine knows how to execute. */
export type SpellEffect =
  | { type: "attack"; damage: string; damageType: DamageType; upcast?: string }
  | { type: "save"; save: Ability; damage: string; damageType: DamageType; halfOnSave: boolean; upcast?: string }
  | { type: "auto-damage"; damage: string; damageType: DamageType; count: number; upcastCount?: number }
  | { type: "heal"; dice: string; upcast?: string }
  | { type: "buff"; description: string }
  | { type: "narrative" };

export interface SpellData {
  id: string;
  name: string;
  /** 0 = cantrip */
  level: number;
  school: SpellSchool;
  castingTime: string;
  range: string;
  /** Area of effect from the SRD, when the spell has one (size in feet) */
  area?: { shape: "sphere" | "cube" | "cone" | "line" | "cylinder"; size: number };
  components: { v: boolean; s: boolean; m?: string };
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higherLevel?: string;
  /** Class ids that can learn this spell */
  classes: string[];
  effect: SpellEffect;
}
