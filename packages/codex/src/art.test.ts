import { describe, expect, it } from "vitest";
import { artFor, isArt } from "@dnd/assets";
import { MONSTERS } from "@dnd/data";
import { ART_KIND, artCoverage, listShowsArt } from "./art";

describe("Codex art (DAG-80)", () => {
  it("measures each chapter's art against its entries", () => {
    expect(artCoverage("bestiary")).toBe(MONSTERS.filter((m) => isArt(artFor("monster", m.id, "thumb"))).length / MONSTERS.length);
    for (const chapter of Object.keys(ART_KIND) as (keyof typeof ART_KIND)[]) {
      expect(artCoverage(chapter)).toBeGreaterThanOrEqual(0);
      expect(artCoverage(chapter)).toBeLessThanOrEqual(1);
    }
  });

  it("puts pictures on list rows only once half a chapter has art", () => {
    for (const chapter of Object.keys(ART_KIND) as (keyof typeof ART_KIND)[]) expect(listShowsArt(chapter), chapter).toBe(artCoverage(chapter) >= 0.5);
    // Every creature has art (DAG-71); the spells have only a couple so far (DAG-73).
    expect(listShowsArt("bestiary")).toBe(true);
  });
});
