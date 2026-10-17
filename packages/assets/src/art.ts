// The art manifest (DAG-70): one way for every app to find the picture for a thing in the game.
// art/art.json lists each entity that has art (its kind, id, alt text, style and subject); the files
// live at files/art/<kind>/<id>/<size>.webp and every one is in the licence log. Changing a pack
// means changing files and the manifest, not code.
//
// The URLs come from artFiles.ts (a Vite glob), so the files are loaded on demand by the browser and
// never inlined into a script. The Codex single-file build swaps that module for an empty one.

import manifest from "../art/art.json";
import { ART_URLS, ICON_URLS } from "./artFiles";
import { LICENCE_LOG, type LicenceEntry } from "./licences";

/**
 * What a picture is of. A class has two: its emblem (`class`, small, on option cards and the board)
 * and an illustration of a hero of that class (`class-art`, on the lore panel and the Codex page).
 * A `portrait` is a hero's face to pick in the creator (DAG-74), by race and sex. A `school` is the
 * mark of a school of magic (DAG-73), by the school's name ("evocation"). A `map` picture is a
 * symbol on the World and Zone maps (DAG-85): a settlement, a site or a bridge, by the ids in
 * mapSymbols.ts ("village-2"). A `terrain` picture is a seamless painted ground texture for the
 * World view (DAG-87), by the ids in terrain.ts ("temperate-forest-1"). A `ground` picture is a
 * seamless texture for the 3D stage's terrain shader (DAG-145), by layer ("grass", "rock"). A
 * `foliage` picture is a painted plant on transparency for the 3D stage's foliage cards (DAG-149), by
 * the ids in foliage.ts ("tree-oak", "grass-tuft"). A `figure` is a hero standing full length (DAG-128),
 * by the id of the portrait it matches ("elf-female-1", "premade-aren"): the hero's card on the 3D
 * stage, and a front-on reference for a 3D model later. A `ui` picture is a painted part of the
 * interface (DAG-158), by the ids in ui.ts ("frame-ornate", "ring-foe"): a tile, a nine-slice frame or
 * plate, or a ring, divider, corner or icon, which @dnd/ui's components are drawn with. A `cover` is
 * the painting at the top of a settlement's page (DAG-174), by the ids in covers.ts ("town-cold").
 */
export type ArtKind = "monster" | "item" | "spell" | "school" | "class" | "class-art" | "race" | "portrait" | "map" | "terrain" | "ground" | "foliage" | "figure" | "ui" | "cover";
/**
 * `texture` is a terrain's seamless, repeating painting at full size. `card` is a plant trimmed to its
 * outline, centred, with its base on the bottom edge, so it stands on the ground as a card. `figure`
 * is a hero at full resolution in an upright 2:3 frame (`sizes.figure` high), every one at the same
 * scale: head to feet filling the same height, feet on the same line, centred across. A figure's
 * `page` is that frame set in a square, feet on the bottom edge, for the stage's square cards. `ui` is
 * a UI part as drawn: cropped to its painted edge (a tile: made seamless), its longer side `sizes.ui`.
 * `cover` is a settlement's cover: a 21:8 banner `sizes.cover` wide, cut from its painting (opaque).
 */
export type ArtSize = "page" | "thumb" | "token" | "texture" | "card" | "figure" | "ui" | "cover";

/** One house style: the words every picture in it is generated with (DAG-69: ink and watercolour). */
export interface ArtStyle {
  name: string;
  model: string;
  brief: string;
  /** What the style's pictures are for, in the licence log's pack. */
  use?: string;
  /** Painted edge to edge on an opaque ground (terrain textures), not on a transparent background. */
  opaque?: boolean;
  /** Approved entities ("monster/goblin") whose pictures go with each prompt to hold the style. */
  references?: string[];
}

/** An entity with art. An entry with `sameAs` has only kind, id and sameAs. */
export interface ArtEntry {
  kind: ArtKind;
  id: string;
  /** What the picture shows, for screen readers. */
  alt: string;
  /** A key of `styles`. */
  style: string;
  /** The subject as given to the generator, with the style brief added. */
  subject: string;
  /** Where the token is cut from the page picture, in fractions of it, when the automatic crop is wrong. */
  focus?: { x: number; y: number; size: number };
  /**
   * Another entity whose picture this one shares ("monster/giant-rat"), for variants that look the
   * same (a diseased giant rat). Such an entry has no files of its own.
   */
  sameAs?: string;
  /** How a `ui` picture is drawn and cut (DAG-158). */
  ui?: UiPart;
}

/**
 * A painted UI part (DAG-158): what it is, how it is cut from its painting, and the colours text sits
 * on, measured when it is cut so the contrast check can test every text colour against the art.
 */
export interface UiPart {
  /**
   * `tile`: an opaque texture made seamless and repeated behind things. `frame`: a nine-slice frame or
   * plate, stretched around a box. `object`: drawn whole (a ring, a divider, a corner, an icon).
   */
  part: "tile" | "frame" | "object";
  /** A frame's nine-slice insets in percent of the cut part: top, right, bottom, left (CSS `border-image-slice`). */
  slice?: [number, number, number, number];
  /** The frame's middle is painted (a parchment card, a button plate) and fills the box. */
  fill?: boolean;
  /** One cell of a sheet of parts: column, row, columns, rows. */
  cell?: [number, number, number, number];
  /**
   * Recolouring before the cut: `scale` multiplies every channel (0.75 is a quarter darker, keeping the
   * hue), `tint` keeps the painting's light and shade in another colour (the rings).
   */
  recolour?: { scale?: number; tint?: string };
  /**
   * Where text sits on the part (a tile's whole face, a frame's painted middle, an object's paint):
   * its mean colour and its darkest and lightest tenth, as "#rrggbb". Measured when the part is cut.
   */
  surface?: { mean: string; dark: string; light: string };
}

export interface ArtManifest {
  /**
   * Pixel sizes: the page picture's width and height, the thumbnail's, the token's, a terrain
   * texture's and a foliage card's side, a hero figure's height (its width is two thirds of it), and
   * a UI part's longer side.
   */
  sizes: Record<ArtSize, number>;
  styles: Record<string, ArtStyle>;
  entries: ArtEntry[];
}

export const ART_MANIFEST = manifest as ArtManifest;

/** Which sizes each kind has. Tokens are for what stands on the board: creatures, heroes' portraits and figures. */
export const ART_SIZES: Record<ArtKind, readonly ArtSize[]> = {
  monster: ["page", "thumb", "token"],
  item: ["page", "thumb"],
  spell: ["page", "thumb"],
  school: ["page", "thumb"],
  class: ["page", "thumb"],
  "class-art": ["page", "thumb"],
  race: ["page", "thumb"],
  portrait: ["page", "thumb", "token"],
  map: ["page", "thumb"],
  terrain: ["texture", "thumb"],
  ground: ["texture", "thumb"],
  foliage: ["card", "thumb"],
  figure: ["figure", "page", "thumb", "token"],
  ui: ["ui", "thumb"],
  cover: ["cover", "thumb"],
};

/** Where a picture's file lives, relative to packages/assets. */
export const artPath = (kind: ArtKind, id: string, size: ArtSize) => `files/art/${kind}/${id}/${size}.webp`;

export interface Art {
  kind: ArtKind;
  id: string;
  size: ArtSize;
  src: string;
  alt: string;
  /** AI-generated (disclosed in the credits). */
  ai: boolean;
  /** Someone has looked at it; unreviewed art can't ship in a release. */
  reviewed: boolean;
  placeholder: boolean;
  /** The licence log's entry for the file. */
  licence: LicenceEntry | undefined;
}

/** A stand-in when an entity has no art: a game-icons.net silhouette, drawn by the caller in a ring. */
export interface ArtFallback {
  kind: ArtKind;
  id: string;
  fallback: "icon";
  src: string;
  /** The silhouette's file, relative to packages/assets (as in `artPath`). */
  path: string;
  alt: string;
}

/** What `artFor` may use to pick a stand-in. */
export interface ArtHint {
  /** A monster's creature type ("undead"), for its silhouette. */
  creatureType?: string | undefined;
  /** An entity's name, for the stand-in's alt text. */
  name?: string | undefined;
}

const entries = new Map(ART_MANIFEST.entries.map((e) => [`${e.kind}/${e.id}`, e]));
const logged = new Map(LICENCE_LOG.files.map((e) => [e.file, e]));

/** The manifest entry for an entity, if it has art. */
export function artEntry(kind: ArtKind, id: string): ArtEntry | undefined {
  return entries.get(`${kind}/${id}`);
}

/**
 * The picture for an entity at a size, or a silhouette standing in for it (a monster by creature
 * type, a class by its emblem), or null when there is neither (the caller draws its own, such as a
 * monogram or a crest). Art of a size the kind doesn't have falls back to the kind's first size
 * (the page picture, or a terrain's texture).
 */
export function artFor(kind: ArtKind, id: string, size: ArtSize, hint: ArtHint = {}): Art | ArtFallback | null {
  let entry = entries.get(`${kind}/${id}`);
  if (entry?.sameAs) {
    const target = entries.get(entry.sameAs);
    if (target && !target.sameAs) {
      const art = artFor(target.kind, target.id, size, hint);
      return isArt(art) ? { ...art, kind, id } : art;
    }
    entry = undefined;
  }
  if (entry) {
    const use = ART_SIZES[kind].includes(size) ? size : ART_SIZES[kind][0]!;
    const src = ART_URLS[artPath(kind, id, use)];
    if (src) {
      const licence = logged.get(`packages/assets/${artPath(kind, id, use)}`);
      return { kind, id, size: use, src, alt: entry.alt, ai: !!licence?.ai, reviewed: !licence?.ai || licence.ai.reviewed, placeholder: !!licence?.placeholder, licence };
    }
  }
  const path = fallbackPath(kind, id, hint);
  const icon = path && ICON_URLS[path];
  if (path && icon) return { kind, id, fallback: "icon", src: icon, path, alt: hint.name ?? id.replace(/-/g, " ") };
  return null;
}

/** Where an entity's stand-in silhouette would be: a monster's by creature type, a class's emblem. */
function fallbackPath(kind: ArtKind, id: string, hint: ArtHint): string | undefined {
  if (kind === "monster" && hint.creatureType) return `files/icons/creature-types/${hint.creatureType.toLowerCase()}.svg`;
  if (kind === "class") return `files/icons/classes/${id}.svg`;
  return undefined;
}

/**
 * A hero's full-body picture (DAG-128): the figure of the painted portrait they chose, or their
 * class's picture when they have none (a crest or an image of their own) or it has no figure yet.
 */
export function heroFigure(hero: { classId: string; portrait?: { kind: string; id?: string } | undefined }, size: ArtSize = "page"): Art | ArtFallback | null {
  const id = hero.portrait?.kind === "art" ? hero.portrait.id : undefined;
  const figure = id ? artFor("figure", id, size) : null;
  return isArt(figure) ? figure : artFor("class-art", hero.classId, size);
}

/** A monster's creature type as the silhouettes name it: "swarm of Tiny beasts" is a beast. */
export function silhouetteType(type: string | undefined): string | undefined {
  return type && /^swarm\b/i.test(type) ? "beast" : type;
}

export type PortraitSex = "female" | "male";

/** A portrait on offer in the creator. Its id says whose it is: "<race>-<sex>-<n>" ("half-elf-female-2"). */
export interface PortraitArt {
  id: string;
  raceId: string;
  sex: PortraitSex;
  alt: string;
}

const PORTRAIT_ID = /^([a-z]+(?:-[a-z]+)*)-(female|male)-(\d+)$/;

/** The portraits for a race, women first then men, or every portrait when no race is given. */
export function portraitsFor(raceId?: string): PortraitArt[] {
  const out: PortraitArt[] = [];
  for (const e of ART_MANIFEST.entries) {
    const m = e.kind === "portrait" ? PORTRAIT_ID.exec(e.id) : null;
    if (!m || (raceId && m[1] !== raceId)) continue;
    out.push({ id: e.id, raceId: m[1]!, sex: m[2] as PortraitSex, alt: e.alt });
  }
  return out.sort((a, b) => a.raceId.localeCompare(b.raceId) || a.sex.localeCompare(b.sex) || a.id.localeCompare(b.id, "en", { numeric: true }));
}

/**
 * The mark on a magic item's picture (DAG-72): a pip in its rarity's colour, the same in every app,
 * so a magic item reads as one even at 32 px. "varies" is for items whose rarity depends on the copy.
 */
export const RARITY_COLOURS: Record<string, string> = {
  common: "#8d8a83",
  uncommon: "#3f8f4a",
  rare: "#2f68b8",
  "very rare": "#7d45a8",
  legendary: "#c46a1c",
  artifact: "#a52a1f",
  varies: "#b08a3e",
};

/** True for a real picture, false for a stand-in. */
export const isArt = (a: Art | ArtFallback | null): a is Art => !!a && !("fallback" in a);

/** A painted UI part (DAG-158), ready to draw: its file, how it is cut, and whether it is reviewed. */
export interface UiArt {
  id: string;
  src: string;
  alt: string;
  part: UiPart;
  reviewed: boolean;
}

/** The painted UI part with this id ("frame-ornate"), or null when it has no art. */
export function uiArt(id: string): UiArt | null {
  const part = entries.get(`ui/${id}`)?.ui;
  const art = artFor("ui", id, "ui");
  return part && isArt(art) ? { id, src: art.src, alt: art.alt, part, reviewed: art.reviewed } : null;
}
