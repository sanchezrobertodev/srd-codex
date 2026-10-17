import { describe, expect, it } from "vitest";
import {
  ALIGNMENT_ENCOUNTERS, BIOME_ENCOUNTERS, findMonster, MONSTERS, NOT_IN_ENCOUNTER_TABLES, SITE_ENCOUNTERS, WILDNESS_ENCOUNTERS, XP_BUDGET_PER_CHARACTER,
  type EncounterEntry,
} from "./index";

const tables: [string, readonly EncounterEntry[]][] = [
  ...Object.entries(BIOME_ENCOUNTERS).map(([k, v]) => [`biome ${k}`, v] as [string, readonly EncounterEntry[]]),
  ...Object.entries(WILDNESS_ENCOUNTERS).map(([k, v]) => [`wildness ${k}`, v] as [string, readonly EncounterEntry[]]),
  ...Object.entries(ALIGNMENT_ENCOUNTERS).map(([k, v]) => [`alignment ${k}`, v] as [string, readonly EncounterEntry[]]),
  ...Object.entries(SITE_ENCOUNTERS).map(([k, v]) => [`site ${k}`, v] as [string, readonly EncounterEntry[]]),
];
const ids = (row: EncounterEntry) => [row.monsterId, ...(row.with ?? []).map((w) => w.monsterId)];

describe("encounter tables (DAG-33)", () => {
  it("name only SRD monsters of CR 2 or lower, in sensible numbers and weights", () => {
    for (const [name, rows] of tables) {
      for (const row of rows) {
        for (const id of ids(row)) {
          const m = findMonster(id);
          expect(m, `${name}: ${id}`).toBeDefined();
          expect(m!.cr, `${name}: ${id}`).toBeLessThanOrEqual(2);
        }
        expect(row.min, `${name}: ${row.monsterId}`).toBeGreaterThanOrEqual(1);
        expect(row.max).toBeGreaterThanOrEqual(row.min);
        expect(Number.isInteger(row.weight) && row.weight >= 1).toBe(true);
        for (const w of row.with ?? []) expect(w.max).toBeGreaterThanOrEqual(w.min);
      }
    }
  });

  it("cover every creature of CR 2 or lower, or say why one is left out", () => {
    const used = new Set(tables.flatMap(([, rows]) => rows.flatMap(ids)));
    const low = MONSTERS.filter((m) => m.cr <= 2).map((m) => m.id);
    expect(low).toHaveLength(181);
    expect(low.filter((id) => !used.has(id) && !NOT_IN_ENCOUNTER_TABLES[id])).toEqual([]);
    // Left out means left out: none of them is in a table after all, and each exists.
    for (const id of Object.keys(NOT_IN_ENCOUNTER_TABLES)) {
      expect(used.has(id), id).toBe(false);
      expect(findMonster(id), id).toBeDefined();
    }
  });

  it("carry the SRD 5.2.1 XP budget per character for levels 1-20", () => {
    expect(XP_BUDGET_PER_CHARACTER).toHaveLength(20);
    expect(XP_BUDGET_PER_CHARACTER[0]).toEqual([50, 75, 100]);
    expect(XP_BUDGET_PER_CHARACTER[2]).toEqual([150, 225, 400]);
    expect(XP_BUDGET_PER_CHARACTER[19]).toEqual([6400, 13200, 22000]);
    for (const [low, moderate, high] of XP_BUDGET_PER_CHARACTER) expect(low < moderate && moderate < high).toBe(true);
  });
});
