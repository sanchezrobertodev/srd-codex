import { describe, expect, it } from "vitest";
import { CREST_FIELDS } from "@dnd/shared";
import { CLASSES, CLASS_EMBLEMS, CREST_FIELD_LABELS, PREMADE_HEROES, RACE_COLOURS, RACES, TINCTURES, describeCrest, raceColours } from "./index";

const METALS = [TINCTURES.or, TINCTURES.argent];

describe("crest colours and emblems (DAG-54)", () => {
  it("gives every SRD race two colours and a metal, each pair its own", () => {
    for (const r of RACES) {
      const c = RACE_COLOURS[r.id];
      expect(c, r.id).toBeDefined();
      // The rule of tincture: the emblem is a metal, the field two colours, so the emblem always stands out.
      expect(METALS).toContain(c!.metal);
      for (const f of c!.field) expect(METALS).not.toContain(f);
      expect(c!.field[0]).not.toBe(c!.field[1]);
    }
    const pairs = Object.values(RACE_COLOURS).map((c) => c.field.map((f) => f.hex).join());
    expect(new Set(pairs).size).toBe(pairs.length);
    expect(raceColours("unknown")).toBe(RACE_COLOURS.human);
  });

  it("names an emblem for every SRD class and a label for every shield design", () => {
    for (const c of CLASSES) expect(CLASS_EMBLEMS[c.id], c.id).toBeTruthy();
    for (const f of CREST_FIELDS) expect(CREST_FIELD_LABELS[f]).toBeTruthy();
  });

  it("describes a crest in words, for its text alternative", () => {
    expect(describeCrest("dwarf", "fighter", "quarterly")).toBe("crossed swords in gold on red and black, quartered");
    expect(describeCrest("elf", "wizard", "plain")).toBe("an open book beneath a star in silver on green");
  });

  it("gives the ready-made heroes a known crest design", () => {
    for (const h of PREMADE_HEROES) expect(CREST_FIELDS, h.id).toContain(h.crest);
  });
});
