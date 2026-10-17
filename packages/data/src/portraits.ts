// Portraits (DAG-54): until the art pipeline (DAG-38, DAG-40) brings real portraits, each hero has
// a crest drawn by code: the class's emblem in the race's metal, on a shield of the race's two
// colours. The colours follow heraldry's rule of tincture (a metal on colours), which keeps the
// emblem readable on every design. The drawings themselves live with the web app.

import type { CrestField } from "@dnd/shared";

export interface Tincture {
  name: string;
  hex: string;
}

/** Heraldic tinctures, toned for the game's dark parchment UI. */
export const TINCTURES = {
  azure: { name: "blue", hex: "#2e5a9c" },
  gules: { name: "red", hex: "#9b2d2a" },
  vert: { name: "green", hex: "#2f7348" },
  sable: { name: "black", hex: "#2a2623" },
  purpure: { name: "purple", hex: "#6a3f86" },
  tenne: { name: "tawny", hex: "#a8612a" },
  or: { name: "gold", hex: "#e6c36a" },
  argent: { name: "silver", hex: "#ece6d6" },
} satisfies Record<string, Tincture>;

export interface RaceColours {
  /** The shield's two colours: the first fills a plain shield and the upper or first part. */
  field: [Tincture, Tincture];
  /** The emblem's metal. */
  metal: Tincture;
}

const t = TINCTURES;

/** Each SRD race's colours; every pair differs, so the race reads from the shield alone. */
export const RACE_COLOURS: Record<string, RaceColours> = {
  human: { field: [t.azure, t.gules], metal: t.or },
  dwarf: { field: [t.gules, t.sable], metal: t.or },
  elf: { field: [t.vert, t.azure], metal: t.argent },
  halfling: { field: [t.vert, t.tenne], metal: t.or },
  dragonborn: { field: [t.tenne, t.sable], metal: t.or },
  gnome: { field: [t.purpure, t.vert], metal: t.argent },
  "half-elf": { field: [t.azure, t.purpure], metal: t.argent },
  "half-orc": { field: [t.sable, t.vert], metal: t.argent },
  tiefling: { field: [t.purpure, t.gules], metal: t.or },
};

/** The colours for a race, with the human's for an unknown one. */
export const raceColours = (raceId: string): RaceColours => RACE_COLOURS[raceId] ?? RACE_COLOURS.human!;

/** What each class's emblem shows, for the crest's text alternative. */
export const CLASS_EMBLEMS: Record<string, string> = {
  barbarian: "a great axe",
  bard: "a lyre",
  cleric: "a radiant sun",
  druid: "an oak leaf",
  fighter: "crossed swords",
  monk: "an open circle",
  paladin: "a sword within a halo",
  ranger: "a drawn bow",
  rogue: "a mask",
  sorcerer: "a flame",
  warlock: "an eye",
  wizard: "an open book beneath a star",
};

/** The shield designs, as the player picks them. */
export const CREST_FIELD_LABELS: Record<CrestField, string> = {
  "per-bend": "Diagonal",
  "per-pale": "Halves",
  quarterly: "Quarters",
  chevron: "Chevron",
  plain: "Plain",
};

/** A crest in words: "crossed swords in gold on blue and red, quartered". */
export function describeCrest(raceId: string, classId: string, field: CrestField): string {
  const c = raceColours(raceId);
  const emblem = CLASS_EMBLEMS[classId] ?? "an emblem";
  const ground = field === "plain" ? c.field[0].name : `${c.field[0].name} and ${c.field[1].name}`;
  const design = { "per-bend": ", divided diagonally", "per-pale": ", divided in halves", quarterly: ", quartered", chevron: ", with a chevron", plain: "" }[field];
  return `${emblem} in ${c.metal.name} on ${ground}${design}`;
}
