import { describe, expect, it } from "vitest";
import { CLASS_GUIDE, CLASSES, GLOSSARY, RACE_GUIDE, RACES, SUGGESTED_SPELLS, getSpell, spellFacts, spellsForClass } from "./index";

describe("creator guide (DAG-49)", () => {
  it("covers every class and race", () => {
    expect(Object.keys(CLASS_GUIDE).sort()).toEqual(CLASSES.map((c) => c.id).sort());
    expect(Object.keys(RACE_GUIDE).sort()).toEqual(RACES.map((r) => r.id).sort());
    for (const g of [...Object.values(CLASS_GUIDE), ...Object.values(RACE_GUIDE)]) expect(g.summary.length).toBeLessThanOrEqual(90);
    for (const g of Object.values(GLOSSARY)) expect(g.text.length).toBeLessThanOrEqual(140);
  });

  it("suggests only spells the class can take at level 1, cantrips and level-1 spells in their own lists", () => {
    for (const [classId, s] of Object.entries(SUGGESTED_SPELLS)) {
      const list = spellsForClass(classId, 1);
      for (const id of s.cantrips) expect(list.find((x) => x.id === id)?.level, `${classId} ${id}`).toBe(0);
      for (const id of s.spells) expect(list.find((x) => x.id === id)?.level, `${classId} ${id}`).toBe(1);
    }
  });

  it("sorts spells into damage, healing and utility, and finds the save they call for", () => {
    expect(spellFacts(getSpell("fire-bolt"))).toMatchObject({ kind: "damage" });
    expect(spellFacts(getSpell("fire-bolt")).save).toBeUndefined();
    expect(spellFacts(getSpell("sacred-flame"))).toMatchObject({ kind: "damage", save: "dex" });
    expect(spellFacts(getSpell("cure-wounds"))).toMatchObject({ kind: "healing" });
    expect(spellFacts(getSpell("light"))).toMatchObject({ kind: "utility" });
    // A utility spell whose save is only in its text.
    expect(spellFacts(getSpell("command"))).toMatchObject({ kind: "utility", save: "wis" });
    for (const s of spellsForClass("wizard", 1)) expect(spellFacts(s).oneLine.length).toBeLessThanOrEqual(110);
  });
});
