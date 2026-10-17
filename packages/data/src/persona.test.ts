import { describe, expect, it } from "vitest";
import { PERSONA_LIMITS } from "@dnd/shared";
import { APPEARANCE_PARTS, BACKGROUNDS, BACKSTORY_TURNS, GENERIC_PERSONA, personaTables } from "./index";

describe("persona suggestion tables (DAG-52)", () => {
  it("gives every background tables: the Acolyte its own SRD ones, the rest the original ones", () => {
    for (const b of BACKGROUNDS) {
      const t = personaTables(b.name);
      expect(t.fromBackground, b.name).toBe(b.source === "srd-5.1");
      for (const list of [t.traits, t.ideals, t.bonds, t.flaws]) expect(list.length, b.name).toBeGreaterThanOrEqual(6);
    }
  });

  it("keeps every suggestion within the persona's limits, including the longest backstory", () => {
    for (const [table, max] of [[GENERIC_PERSONA.traits, PERSONA_LIMITS.trait], [GENERIC_PERSONA.ideals, PERSONA_LIMITS.ideal], [GENERIC_PERSONA.bonds, PERSONA_LIMITS.bond], [GENERIC_PERSONA.flaws, PERSONA_LIMITS.flaw]] as const) {
      for (const line of table) expect(line.length).toBeLessThanOrEqual(max);
    }
    const longestAppearance = `${[...APPEARANCE_PARTS.builds].sort((a, b) => b.length - a.length)[0]}, with ${[...APPEARANCE_PARTS.features].sort((a, b) => b.length - a.length)[0]} and ${[...APPEARANCE_PARTS.touches].sort((a, b) => b.length - a.length)[0]}.`;
    expect(longestAppearance.length).toBeLessThanOrEqual(PERSONA_LIMITS.appearance);
    const longestTurn = Math.max(...BACKSTORY_TURNS.map((t) => t.length));
    for (const b of BACKGROUNDS) expect(b.summary.length + 1 + longestTurn, b.name).toBeLessThanOrEqual(PERSONA_LIMITS.backstory);
  });
});
