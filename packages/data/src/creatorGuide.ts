// Guidance for the character creator's option cards (DAG-49): a line on each class and race, how
// much bookkeeping it brings, suggested starting spells, short explanations of the rules' terms,
// and the facts a spell card shows. The wording is original, written for this game; the rules it
// describes are SRD 5.1's.

import type { Ability, SpellData } from "@dnd/shared";

/** How much a choice asks of a new player. */
export type Complexity = "first-pick" | "some-choices" | "many-options";

export const COMPLEXITY_LABELS: Record<Complexity, string> = {
  "first-pick": "Good first pick",
  "some-choices": "A few extra choices",
  "many-options": "Many options",
};

export interface ClassGuide {
  /** What the class does in a party, in a few words. */
  role: string;
  summary: string;
  complexity: Complexity;
}

export const CLASS_GUIDE: Record<string, ClassGuide> = {
  barbarian: { role: "Front-line bruiser", summary: "A furious warrior who shrugs off blows and hits back harder.", complexity: "first-pick" },
  bard: { role: "Support caster", summary: "A performer whose magic inspires friends and unsettles foes.", complexity: "many-options" },
  cleric: { role: "Healer and protector", summary: "A servant of a god who heals, shields and smites with divine magic.", complexity: "many-options" },
  druid: { role: "Nature caster", summary: "A keeper of the wild who calls on the magic of beasts and storms.", complexity: "many-options" },
  fighter: { role: "Weapon expert", summary: "A trained warrior at home in any armor and with any weapon.", complexity: "first-pick" },
  monk: { role: "Mobile striker", summary: "A martial artist who fights unarmed with speed and discipline.", complexity: "some-choices" },
  paladin: { role: "Holy warrior", summary: "A sworn champion in heavy armor who heals allies and smites foes.", complexity: "some-choices" },
  ranger: { role: "Scout and archer", summary: "A hunter and tracker who is at home far from any road.", complexity: "some-choices" },
  rogue: { role: "Skill expert and striker", summary: "A nimble specialist who strikes where it hurts and talks or sneaks past the rest.", complexity: "first-pick" },
  sorcerer: { role: "Innate caster", summary: "A born spellcaster who bends a few spells in flexible ways.", complexity: "many-options" },
  warlock: { role: "Pact caster", summary: "A seeker of power who bargained with something otherworldly for it.", complexity: "many-options" },
  wizard: { role: "Arcane scholar", summary: "A student of magic with the widest spell list and a spellbook to grow.", complexity: "many-options" },
};

export interface RaceGuide {
  summary: string;
  complexity: Complexity;
}

export const RACE_GUIDE: Record<string, RaceGuide> = {
  human: { summary: "Adaptable and ambitious: a little better at everything, and one more language.", complexity: "first-pick" },
  elf: { summary: "Graceful and keen-eyed, with a wizard's cantrip of their own and no need for sleep.", complexity: "some-choices" },
  dwarf: { summary: "Sturdy and stubborn: hard to poison, hard to kill, and handy with a tool.", complexity: "first-pick" },
  halfling: { summary: "Small, nimble and uncannily lucky, good at slipping past bigger folk.", complexity: "first-pick" },
  dragonborn: { summary: "Proud and draconic, with a breath weapon and a resistance from their ancestry.", complexity: "some-choices" },
  gnome: { summary: "Small, clever and curious, with a mind that resists magic.", complexity: "first-pick" },
  "half-elf": { summary: "At home among many peoples, with extra skills and a winning manner.", complexity: "some-choices" },
  "half-orc": { summary: "Strong and fierce, hard to put down and brutal with a critical hit.", complexity: "first-pick" },
  tiefling: { summary: "Marked by an infernal heritage, with a resistance to fire and a little magic.", complexity: "some-choices" },
};

/**
 * Starting spells to suggest, best first: picks that are useful in most adventures and easy to
 * use. Classes without an entry fall back to their spell list's order.
 */
export const SUGGESTED_SPELLS: Record<string, { cantrips: string[]; spells: string[] }> = {
  wizard: {
    cantrips: ["fire-bolt", "mage-hand", "light", "ray-of-frost", "minor-illusion", "prestidigitation"],
    spells: ["magic-missile", "shield", "mage-armor", "sleep", "burning-hands", "detect-magic", "thunderwave", "find-familiar"],
  },
  cleric: {
    cantrips: ["sacred-flame", "guidance", "light", "spare-the-dying", "thaumaturgy"],
    spells: ["guiding-bolt", "healing-word", "shield-of-faith", "sanctuary", "command", "inflict-wounds"],
  },
  // Classes that know their spells (DAG-57): what they learn first.
  bard: {
    cantrips: ["vicious-mockery", "minor-illusion", "mage-hand", "prestidigitation", "light"],
    spells: ["healing-word", "sleep", "hideous-laughter", "charm-person", "thunderwave", "heroism", "cure-wounds"],
  },
  sorcerer: {
    cantrips: ["fire-bolt", "ray-of-frost", "shocking-grasp", "mage-hand", "light", "prestidigitation"],
    spells: ["magic-missile", "shield", "burning-hands", "sleep", "mage-armor", "thunderwave"],
  },
  // Eldritch Blast first; the Fiend's Burning Hands and Command are on the list too (DAG-65).
  warlock: {
    cantrips: ["eldritch-blast", "minor-illusion", "mage-hand", "prestidigitation"],
    spells: ["hellish-rebuke", "burning-hands", "charm-person", "command", "protection-from-evil-and-good", "expeditious-retreat", "unseen-servant"],
  },
  druid: {
    cantrips: ["produce-flame", "shillelagh", "guidance", "druidcraft", "poison-spray", "resistance"],
    spells: ["healing-word", "entangle", "faerie-fire", "goodberry", "thunderwave", "cure-wounds", "fog-cloud"],
  },
  // The Ranger casts from level 2 (DAG-63); these are the spells it learns first.
  ranger: {
    cantrips: [],
    spells: ["hunters-mark", "cure-wounds", "goodberry", "fog-cloud", "longstrider", "alarm"],
  },
  // The Paladin casts from level 2 (DAG-62); these are what it prepares first.
  paladin: {
    cantrips: [],
    spells: ["cure-wounds", "bless", "shield-of-faith", "divine-favor", "heroism", "command"],
  },
};

export type TermId = "hit-die" | "saving-throw" | "proficiency" | "modifier" | "expertise" | "cantrip" | "spell-slot" | "concentration" | "spell-save";

/** Short explanations shown next to the rules' terms. */
export const GLOSSARY: Record<TermId, { term: string; text: string }> = {
  "hit-die": { term: "Hit die", text: "The die for your hit points. Level 1 starts at its highest roll plus your Constitution modifier; bigger dice mean a tougher hero." },
  "saving-throw": { term: "Saving throw", text: "A roll to resist something, like dodging flames (Dexterity) or shrugging off poison (Constitution). Your class makes you better at two." },
  proficiency: { term: "Proficiency", text: "Training in a skill, save, weapon or tool. Rolls that use it add your proficiency bonus, +2 at level 1." },
  modifier: { term: "Modifier", text: "What a score adds to rolls: (score − 10) ÷ 2, rounded down. A 14 adds +2, an 8 adds −1." },
  expertise: { term: "Expertise", text: "Doubles your proficiency bonus for the chosen skills: +4 instead of +2 at level 1." },
  cantrip: { term: "Cantrip", text: "A spell you can cast as often as you like, without using a spell slot." },
  "spell-slot": { term: "Spell slot", text: "What casting a level-1 or higher spell uses up. You get them back after a long rest." },
  concentration: { term: "Concentration", text: "Some spells last while you focus on them. Only one at a time, and taking damage can break it." },
  "spell-save": { term: "Save", text: "The target rolls to resist the spell against your spell save DC; a success usually means less or no effect." },
};

export type SpellKind = "damage" | "healing" | "utility";

export interface SpellFacts {
  kind: SpellKind;
  /** The saving throw the spell calls for, if any. */
  save?: Ability;
  /** The description's first sentence, cut to fit a card. */
  oneLine: string;
}

const ABILITY_BY_NAME: Record<string, Ability> = { strength: "str", dexterity: "dex", constitution: "con", intelligence: "int", wisdom: "wis", charisma: "cha" };

/** What a spell card shows about a spell, derived from its SRD data. */
export function spellFacts(spell: SpellData): SpellFacts {
  const e = spell.effect;
  const kind: SpellKind = e.type === "heal" ? "healing" : e.type === "attack" || e.type === "save" || e.type === "auto-damage" ? "damage" : "utility";
  const named = /\b(strength|dexterity|constitution|intelligence|wisdom|charisma) saving throw/i.exec(spell.description)?.[1];
  const save = e.type === "save" ? e.save : named ? ABILITY_BY_NAME[named.toLowerCase()] : undefined;
  return { kind, ...(save ? { save } : {}), oneLine: oneLine(spell.description) };
}

/** A text's first sentence, cut at a word to fit a card. */
export function oneLine(text: string, max = 110): string {
  const first = text.split(/(?<=\.)\s/)[0] ?? text;
  return first.length <= max ? first : `${first.slice(0, first.lastIndexOf(" ", max - 3))}…`;
}
