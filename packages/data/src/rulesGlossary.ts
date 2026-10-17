import type { Condition, DamageType, WeaponProperty } from "@dnd/shared";

/**
 * Short, plain-words reminders of what each condition does (DAG-76), for previews in the Codex and
 * anywhere else the game names a condition. Our own wording of the SRD 5.1 rules (CC BY 4.0); the
 * engine's rules are the source of truth.
 */
export const CONDITION_TEXT: Record<Condition, string> = {
  blinded: "Can't see: fails any check that needs sight. Its attacks have disadvantage; attacks against it have advantage.",
  charmed: "Can't attack the charmer or target it with harmful effects, and the charmer has advantage on social checks with it.",
  deafened: "Can't hear: fails any check that needs hearing.",
  frightened: "Disadvantage on checks and attacks while it can see the source of its fear, and it can't willingly move closer to it.",
  grappled: "Speed 0. Ends if the grappler is incapacitated or it's moved out of reach.",
  incapacitated: "Can't take actions or reactions.",
  invisible: "Can't be seen without magic or a special sense. Its attacks have advantage; attacks against it have disadvantage.",
  paralyzed: "Incapacitated and can't move or speak. Fails Strength and Dexterity saves; attacks against it have advantage, and hits from within 5 feet are critical.",
  petrified: "Turned to stone: incapacitated, unaware, resistant to all damage and immune to poison and disease. Fails Strength and Dexterity saves.",
  poisoned: "Disadvantage on attack rolls and ability checks.",
  prone: "Can only crawl, or spend half its movement to stand. Its attacks have disadvantage; attacks against it have advantage within 5 feet and disadvantage beyond.",
  restrained: "Speed 0. Its attacks and Dexterity saves have disadvantage; attacks against it have advantage.",
  stunned: "Incapacitated, can't move and can barely speak. Fails Strength and Dexterity saves; attacks against it have advantage.",
  unconscious: "Incapacitated, drops what it holds and falls prone. Fails Strength and Dexterity saves; attacks against it have advantage, and hits from within 5 feet are critical.",
};

/** What each damage type is, in a few words. */
export const DAMAGE_TYPE_TEXT: Record<DamageType, string> = {
  acid: "Corrosive liquids and digestive enzymes.",
  bludgeoning: "Blunt force: hammers, falling, constriction.",
  cold: "Freezing cold, like a white dragon's breath.",
  fire: "Flames and searing heat.",
  force: "Pure magical energy; very few creatures resist it.",
  lightning: "Electricity.",
  necrotic: "Life-draining energy that withers flesh.",
  piercing: "Puncturing attacks: spears, arrows, bites.",
  poison: "Venom and toxic gas.",
  psychic: "Mental attacks that sear the mind.",
  radiant: "Holy power and searing light.",
  slashing: "Cutting attacks: swords, axes, claws.",
  thunder: "A concussive burst of sound.",
};

/** What each weapon property means, in plain words (DAG-78). Our own wording of the SRD 5.1 rules. */
export const WEAPON_PROPERTY_TEXT: Record<WeaponProperty, string> = {
  ammunition: "Shoots ammunition, used up with each shot; drawing it is part of the attack. After a fight, half the spent ammunition can be found again.",
  finesse: "Attack and damage can use Strength or Dexterity, whichever is better.",
  heavy: "Too big for Small creatures to wield well: they attack with it at disadvantage.",
  light: "Small and easy to handle, so you can fight with one in each hand.",
  loading: "Slow to reload: one shot per action, bonus action or reaction, however many attacks you have.",
  reach: "Strikes 5 feet farther than usual, including for opportunity attacks.",
  special: "Has a rule of its own, below.",
  thrown: "Can be thrown for a ranged attack, using the same ability as in melee.",
  "two-handed": "Takes both hands to attack with.",
  versatile: "Use one hand or two; with two it deals the larger damage.",
  monk: "A monk can fight with it using Martial Arts.",
};

/** The rule of each weapon with the "special" property, in plain words. */
export const WEAPON_SPECIAL_TEXT: Record<string, string> = {
  lance: "Attacks against a target within 5 feet have disadvantage, and it needs two hands unless you're mounted.",
};
