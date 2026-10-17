// The Codex's art (DAG-70, DAG-80): which kind of picture each chapter's entries have, and whether a
// chapter's list is far enough along to show a picture on every row.

import { artFor, isArt, type ArtKind } from "@dnd/assets";
import { ARMORY_ITEMS, classById, monsterById, RACE_ENTRIES, spellById } from "./entries";
import type { CodexChapter } from "./route";

/** Which kind of art each chapter's entries have in the art manifest. */
export const ART_KIND: Record<CodexChapter, ArtKind> = { bestiary: "monster", spells: "spell", armory: "item", classes: "class", races: "race" };

const IDS: Record<CodexChapter, () => string[]> = {
  bestiary: () => [...monsterById.keys()],
  spells: () => [...spellById.keys()],
  armory: () => ARMORY_ITEMS.map((i) => i.id),
  classes: () => [...classById.keys()],
  races: () => RACE_ENTRIES.map((r) => r.id),
};

/** The share of a chapter's entries with a picture of their own (0 in the single-file build, which has none). */
export function artCoverage(chapter: CodexChapter): number {
  const ids = IDS[chapter]();
  return ids.length ? ids.filter((id) => isArt(artFor(ART_KIND[chapter], id, "thumb"))).length / ids.length : 0;
}

const shown = new Map<CodexChapter, boolean>();

/**
 * Whether a chapter's list shows a small picture on each row: once at least half its entries have
 * art, so a chapter whose art is still to come stays a clean list of names rather than a column of
 * blanks. The cards and pages show art (or its stand-in) either way.
 */
export function listShowsArt(chapter: CodexChapter): boolean {
  let on = shown.get(chapter);
  if (on === undefined) shown.set(chapter, (on = artCoverage(chapter) >= 0.5));
  return on;
}
