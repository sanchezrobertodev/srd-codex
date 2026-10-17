import { describe, expect, it } from "vitest";
import { CLASSES, RACES } from "@dnd/data";
import { classById, entry, entryFacts, RACE_ENTRIES, raceById, searchCodex } from "./entries";
import { applyFilters, castingOf, CLASS_SPEC, emptyFilters, encodeFilters, groupOf, RACE_SPEC, raceRaises, type FilterState, type SpecShape } from "./filters";
import { FEATURED } from "./notes";
import { codexHref, parseCodexHash } from "./route";

const state = (spec: SpecShape, patch: Partial<FilterState>): FilterState => ({ ...emptyFilters(spec), ...patch });

describe("Classes and Races chapters (DAG-84)", () => {
  it("has links of their own", () => {
    expect(parseCodexHash("#classes.wizard")).toEqual({ chapter: "classes", id: "wizard", filters: "" });
    expect(parseCodexHash("#races~size-small.halfling")).toEqual({ chapter: "races", id: "halfling", filters: "~size-small" });
    expect(codexHref("races", "dwarf")).toBe("#races.dwarf");
  });

  it("lists every SRD class and race, races by their own name", () => {
    expect(CLASSES.length).toBe(12);
    expect(RACE_ENTRIES.length).toBe(9);
    expect(raceById.get("dwarf")!.name).toBe("Dwarf");
    // The game keeps the subrace's name.
    expect(RACES.find((r) => r.id === "dwarf")!.name).toBe("Hill Dwarf");
    expect(entry("classes", "rogue")).toBe(classById.get("rogue"));
    expect(entryFacts("classes", "fighter")).toBe("d10 · Weapon expert");
    expect(entryFacts("races", "halfling")).toBe("Small · 25 ft.");
    for (const id of [...FEATURED.classes]) expect(classById.has(id), id).toBe(true);
    for (const id of [...FEATURED.races]) expect(raceById.has(id), id).toBe(true);
  });

  it("finds classes and races in the one search", () => {
    expect(searchCodex("wizard")[0]).toMatchObject({ chapter: "classes", hits: [{ id: "wizard" }] });
    expect(searchCodex("dwarf").find((g) => g.chapter === "races")!.hits[0]!.id).toBe("dwarf");
  });

  it("filters classes by how they cast, hit die and primary ability", () => {
    expect(applyFilters(CLASS_SPEC, state(CLASS_SPEC, { picks: { cast: ["full"] } })).map((c) => c.id)).toEqual(["bard", "cleric", "druid", "sorcerer", "wizard"]);
    expect(applyFilters(CLASS_SPEC, state(CLASS_SPEC, { picks: { cast: ["half"] } })).map((c) => c.id)).toEqual(["paladin", "ranger"]);
    expect(castingOf(classById.get("warlock")!)).toBe("pact");
    expect(applyFilters(CLASS_SPEC, state(CLASS_SPEC, { picks: { cast: ["none"] } })).map((c) => c.id)).toEqual(["barbarian", "fighter", "monk", "rogue"]);
    expect(applyFilters(CLASS_SPEC, state(CLASS_SPEC, { picks: { hd: ["12"] } })).map((c) => c.id)).toEqual(["barbarian"]);
    expect(applyFilters(CLASS_SPEC, state(CLASS_SPEC, { picks: { prime: ["dex"] } })).map((c) => c.id)).toEqual(expect.arrayContaining(["rogue", "monk", "ranger", "fighter"]));
    const byHd = state(CLASS_SPEC, { sort: "hd" });
    expect(groupOf(CLASS_SPEC, byHd)!(applyFilters(CLASS_SPEC, byHd)[0]!)).toBe("d12");
    expect(encodeFilters(CLASS_SPEC, state(CLASS_SPEC, { picks: { cast: ["half"] } }))).toBe("~cast-half");
  });

  it("filters races by size, darkvision and the abilities they raise", () => {
    expect(applyFilters(RACE_SPEC, state(RACE_SPEC, { picks: { size: ["small"] } })).map((r) => r.id).sort()).toEqual(["gnome", "halfling"]);
    expect(applyFilters(RACE_SPEC, state(RACE_SPEC, { picks: { dv: ["no"] } })).map((r) => r.id).sort()).toEqual(["dragonborn", "halfling", "human"]);
    // The Half-Elf lets the player raise any two but Charisma (already raised), so it fits Strength too.
    const str = applyFilters(RACE_SPEC, state(RACE_SPEC, { picks: { ability: ["str"] } })).map((r) => r.id);
    expect(str).toEqual(expect.arrayContaining(["dragonborn", "half-orc", "human", "half-elf"]));
    expect(str).not.toContain("elf");
  });

  it("tells a fixed increase from one the player chooses", () => {
    const halfElf = raceById.get("half-elf")!;
    expect(raceRaises(halfElf, "cha")).toBe("fixed");
    expect(raceRaises(halfElf, "int")).toBe("choice");
    expect(raceRaises(raceById.get("elf")!, "dex")).toBe("fixed");
    expect(raceRaises(raceById.get("elf")!, "str")).toBeUndefined();
    // So a class whose main ability isn't Charisma still lists the Half-Elf.
    const forWizard = RACE_ENTRIES.filter((r) => classById.get("wizard")!.primaryAbilities.some((a) => raceRaises(r, a))).map((r) => r.id);
    expect(forWizard).toContain("half-elf");
  });

  it("imports the class tables' own columns and each race's subrace (data)", () => {
    const monk = classById.get("monk")!.columns!;
    expect(monk.map((c) => c.label)).toEqual(["Martial Arts", "Ki Points", "Unarmored Movement"]);
    expect([monk[0]!.values[1], monk[0]!.values[5], monk[0]!.values[17]]).toEqual(["1d4", "1d6", "1d10"]);
    expect(classById.get("barbarian")!.columns![0]!.values[20]).toBe("Unlimited");
    expect(classById.get("rogue")!.columns![0]!.values[11]).toBe("6d6");
    expect(classById.get("fighter")!.columns).toBeUndefined();
    const dwarf = raceById.get("dwarf")!.subrace!;
    expect(dwarf).toEqual({ id: "hill-dwarf", name: "Hill Dwarf", baseName: "Dwarf", abilityBonuses: { wis: 1 }, traitIds: ["dwarven-toughness"] });
    expect(raceById.get("human")!.subrace).toBeUndefined();
  });
});
