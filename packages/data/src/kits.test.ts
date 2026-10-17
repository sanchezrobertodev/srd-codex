import { describe, expect, it } from "vitest";
import { ARCANE_FOCUSES, CLASS_KITS, CLASSES, MVP_CLASSES, STARTING_GOLD, findItem, DRUIDIC_FOCUSES, MUSICAL_INSTRUMENTS } from "./index";

describe("starting equipment (DAG-51)", () => {
  it("gives every playable class a kit whose items, picks and ids all exist", () => {
    for (const cls of MVP_CLASSES) {
      const kit = CLASS_KITS[cls]!;
      const items = [...kit.fixed, ...kit.choices.flatMap((c) => c.options.flatMap((o) => o.items))];
      for (const e of items) expect(findItem(e.itemId), `${cls} ${e.itemId}`).toBeDefined();
      expect(new Set(kit.choices.map((c) => c.id)).size).toBe(kit.choices.length);
      for (const c of kit.choices) {
        expect(new Set(c.options.map((o) => o.id)).size, c.id).toBe(c.options.length);
        expect(c.options.some((o) => !o.unavailable), c.id).toBe(true);
        for (const o of c.options) {
          if (!o.picks) continue;
          expect(o.picks.defaults).toHaveLength(o.picks.count);
          for (const id of o.picks.defaults) {
            const item = findItem(id);
            if (o.picks.from === "arcane-focus") expect(ARCANE_FOCUSES).toContain(id);
            else if (o.picks.from === "druidic-focus") expect(DRUIDIC_FOCUSES).toContain(id);
            else if (o.picks.from === "musical-instrument") expect(MUSICAL_INSTRUMENTS).toContain(id);
            else if (o.picks.from === "simple-melee-weapon") expect(item && item.kind === "weapon" && `${item.category}-${item.rangeType}`, `${c.id} ${id}`).toBe("simple-melee");
            else if (o.picks.from === "martial-melee-weapon") expect(item && item.kind === "weapon" && `${item.category}-${item.rangeType}`, `${c.id} ${id}`).toBe("martial-melee");
            else expect(item && item.kind === "weapon" && `${item.category}-weapon`, `${c.id} ${id}`).toBe(o.picks.from);
          }
        }
      }
    }
    for (const f of [...ARCANE_FOCUSES, ...DRUIDIC_FOCUSES]) expect(findItem(f), f).toBeDefined();
  });

  it("has starting gold for every class", () => {
    expect(Object.keys(STARTING_GOLD).sort()).toEqual(CLASSES.map((c) => c.id).sort());
  });
});
