import { describe, expect, it } from "vitest";
import { SKILL_LIST } from "@dnd/shared";
// The SRD 5.1 Acolyte exactly as the 5e-bits dataset has it (CC-BY-4.0). packages/data/raw/ is a
// local download and not committed, so the test reads this committed copy of the one entry it needs.
import srd from "./fixtures/srd-5.1-acolyte.json";
import { BACKGROUNDS, findBackgroundByName, getBackground } from "./backgrounds";
import { getItem } from "./index";

/** Background names from books other than the SRD, which the game may not use (DAG-43). */
const UNLICENSED = ["Charlatan", "Criminal", "Entertainer", "Folk Hero", "Guild Artisan", "Hermit", "Noble", "Outlander", "Sage", "Sailor", "Soldier", "Urchin"];

describe("backgrounds (DAG-43)", () => {
  it("follow the SRD 5.1 shape: two skills, two tools or languages, equipment, gold and a feature", () => {
    for (const b of BACKGROUNDS) {
      expect(b.skills, b.id).toHaveLength(2);
      expect(new Set(b.skills).size, b.id).toBe(2);
      for (const s of b.skills) expect(SKILL_LIST, `${b.id}: ${s}`).toContain(s);
      expect(b.languages + b.tools.length, b.id).toBe(2);
      for (const t of b.tools) expect(getItem(t).kind, `${b.id}: ${t}`).toBe("gear");
      for (const e of b.equipment) expect(() => getItem(e.itemId), `${b.id}: ${e.itemId}`).not.toThrow();
      expect(b.gold).toBeGreaterThan(0);
      expect(b.feature.name && b.feature.description, b.id).toBeTruthy();
      expect(b.summary.length, b.id).toBeGreaterThan(20);
    }
  });

  it("have unique ids and names, none of them from other books", () => {
    expect(new Set(BACKGROUNDS.map((b) => b.id)).size).toBe(BACKGROUNDS.length);
    expect(new Set(BACKGROUNDS.map((b) => b.name)).size).toBe(BACKGROUNDS.length);
    for (const b of BACKGROUNDS) expect(UNLICENSED, b.name).not.toContain(b.name);
    expect(BACKGROUNDS.filter((b) => b.source === "srd-5.1").map((b) => b.id)).toEqual(["acolyte"]);
  });

  it("keeps the SRD's Acolyte as the SRD has it", () => {
    const acolyte = getBackground("acolyte");
    expect(acolyte.feature.name).toBe(srd.feature.name);
    expect(acolyte.feature.description).toBe(srd.feature.desc.join("\n\n"));
    expect(acolyte.characteristics!.traits).toEqual(srd.personality_traits.from.options.map((o) => o.string));
    expect(acolyte.characteristics!.ideals).toEqual(srd.ideals.from.options.map((o) => o.desc));
    expect(acolyte.skills).toEqual(srd.starting_proficiencies.map((p) => p.index.replace("skill-", "")));
    expect(acolyte.gold).toBe(srd.starting_gold.quantity);
  });

  it("are found by id or by the name characters store", () => {
    expect(getBackground("hedge-scholar").name).toBe("Hedge Scholar");
    expect(findBackgroundByName("Acolyte")?.id).toBe("acolyte");
    expect(findBackgroundByName("Criminal")).toBeUndefined();
    expect(() => getBackground("criminal")).toThrow(/Unknown background/);
  });
});
