import { describe, expect, it } from "vitest";
import { MONSTERS, SPELLS } from "@dnd/data";
import { spellById } from "./entries";
import {
  activeCount, alignmentFits, applyFilters, ARMORY, BESTIARY, castingKind, decodeFilters, emptyFilters, encodeFilters, groupOf, HABITATS, slug, SPELLBOOK, spellDamageTypes, spellSaves,
  type FilterState, type SpecShape,
} from "./filters";
import { codexHref, parseCodexHash } from "./route";

const state = (patch: Partial<FilterState>, spec: SpecShape = BESTIARY): FilterState => ({ ...emptyFilters(spec), ...patch });

describe("filters in the link (DAG-77)", () => {
  it("writes only what is chosen, and reads it back", () => {
    expect(encodeFilters(BESTIARY, emptyFilters(BESTIARY))).toBe("");
    const s = state({ q: "Giant spider", cr: [0.25, 4], picks: { type: ["undead", "swarm of Tiny beasts"], home: ["temperate-forest"] }, sort: "name" });
    const text = encodeFilters(BESTIARY, s);
    expect(text).toBe("~q-giant_spider~cr-1_4-4~type-undead-swarm_of_tiny_beasts~home-temperate_forest~sort-name");
    expect(decodeFilters(BESTIARY, text)).toEqual({ ...s, q: "giant spider" });
  });

  it("fits in a Codex link with an entry, and back", () => {
    const filters = encodeFilters(SPELLBOOK, state({ picks: { lvl: ["3"], conc: ["yes"] } }, SPELLBOOK));
    const href = codexHref("spells", "fly", filters);
    expect(href).toBe("#spells~lvl-3~conc-yes.fly");
    expect(parseCodexHash(href)).toEqual({ chapter: "spells", id: "fly", filters });
    expect(parseCodexHash("#armory~kind-weapon")).toEqual({ chapter: "armory", id: null, filters: "~kind-weapon" });
  });

  it("matches a name filter with punctuation the same after a reload", () => {
    const items = state({ q: "Crossbow, light" }, ARMORY);
    const itemsBefore = applyFilters(ARMORY, items).map((e) => e.id);
    expect(itemsBefore).toContain("crossbow-light");
    expect(applyFilters(ARMORY, decodeFilters(ARMORY, encodeFilters(ARMORY, items))).map((e) => e.id)).toEqual(itemsBefore);
    const creatures = state({ q: "Half-Red Dragon" });
    const creaturesBefore = applyFilters(BESTIARY, creatures).map((e) => e.id);
    expect(creaturesBefore).toContain("half-red-dragon-veteran");
    expect(applyFilters(BESTIARY, decodeFilters(BESTIARY, encodeFilters(BESTIARY, creatures))).map((e) => e.id)).toEqual(creaturesBefore);
  });

  it("ignores what it doesn't recognise, and orders a backwards CR range", () => {
    expect(decodeFilters(BESTIARY, "~nope-x~type-dragon-unicorns~cr-5-1_2~sort-sideways")).toEqual(state({ picks: { type: ["dragon"] }, cr: [0.5, 5] }));
    expect(slug("Thieves' tools, 50 feet")).toBe("thieves_tools_50_feet");
  });
});

describe("the Bestiary's filters (DAG-77)", () => {
  it("filters by a single CR or a range, type, size and name", () => {
    const one = applyFilters(BESTIARY, state({ cr: [2, 2] }));
    expect(one.length).toBeGreaterThan(5);
    expect(one.every((m) => m.cr === 2)).toBe(true);
    const range = applyFilters(BESTIARY, state({ cr: [5, 10], picks: { type: ["giant", "dragon"], size: ["huge"] } }));
    expect(range.length).toBeGreaterThan(0);
    expect(range.every((m) => m.cr >= 5 && m.cr <= 10 && ["giant", "dragon"].includes(m.type) && m.size === "huge")).toBe(true);
    expect(applyFilters(BESTIARY, state({ q: "goblin" })).map((m) => m.id)).toEqual(["goblin", "hobgoblin"]);
  });

  it("reads alignments the way players mean them", () => {
    expect(alignmentFits("chaotic evil", "evil")).toBe(true);
    expect(alignmentFits("any non-good alignment", "good")).toBe(false);
    expect(alignmentFits("any non-good alignment", "any")).toBe(true);
    expect(alignmentFits("lawful neutral", "neutral")).toBe(true);
    expect(alignmentFits("unaligned", "neutral")).toBe(false);
    expect(applyFilters(BESTIARY, state({ picks: { align: ["unaligned"] } })).every((m) => m.alignment === "unaligned")).toBe(true);
  });

  it("knows where creatures live from the encounter tables", () => {
    expect(HABITATS.get("goblin")).toEqual(expect.arrayContaining(["temperate-forest", "dungeon"]));
    const dungeon = applyFilters(BESTIARY, state({ picks: { home: ["dungeon"] } }));
    expect(dungeon.map((m) => m.id)).toEqual(expect.arrayContaining(["skeleton", "mimic", "gelatinous-cube"]));
    // A creature that only comes with another (a bugbear's goblins) counts too.
    expect(HABITATS.size).toBeGreaterThan(100);
  });

  it("sorts and groups by challenge, name or type", () => {
    const byCr = applyFilters(BESTIARY, state({}));
    expect(byCr.length).toBe(MONSTERS.length);
    expect(byCr[0]!.cr).toBe(0);
    expect(groupOf(BESTIARY, state({}))!(byCr[0]!)).toBe("Challenge 0");
    const byName = applyFilters(BESTIARY, state({ sort: "name" }));
    expect(byName[0]!.name <= byName[1]!.name).toBe(true);
    expect(groupOf(BESTIARY, state({ sort: "type" }))!(byName[0]!)).toMatch(/^[A-Z]/);
  });
});

describe("the Spellbook's filters (DAG-77)", () => {
  it("knows each spell's casting time, damage types and saves", () => {
    const fireball = spellById.get("fireball")!;
    expect(castingKind(fireball)).toBe("action");
    expect(spellDamageTypes(fireball)).toEqual(["fire"]);
    expect(spellSaves(fireball)).toEqual(["dex"]);
    expect(castingKind(spellById.get("shield")!)).toBe("reaction");
    expect(castingKind(spellById.get("healing-word")!)).toBe("bonus");
    expect(castingKind(spellById.get("identify")!)).toBe("longer");
  });

  it("combines choices: OR inside a filter, AND across filters", () => {
    const s = applyFilters(SPELLBOOK, state({ picks: { lvl: ["1", "2"], class: ["wizard"], conc: ["yes"] } }, SPELLBOOK));
    expect(s.length).toBeGreaterThan(3);
    expect(s.every((x) => (x.level === 1 || x.level === 2) && x.classes.includes("wizard") && x.concentration)).toBe(true);
    const rituals = applyFilters(SPELLBOOK, state({ picks: { rit: ["yes"] } }, SPELLBOOK));
    expect(rituals.length).toBe(SPELLS.filter((x) => x.ritual).length);
    const fireDex = applyFilters(SPELLBOOK, state({ picks: { dmg: ["fire"], save: ["dex"] } }, SPELLBOOK)).map((x) => x.id);
    expect(fireDex).toEqual(expect.arrayContaining(["fireball", "burning-hands"]));
    expect(activeCount(state({ q: "fire", picks: { lvl: ["1", "2"], conc: ["yes"] } }, SPELLBOOK))).toBe(4);
  });
});

describe("the Armory's filters (DAG-77)", () => {
  it("filters by kind, category, range, property, cost and weight, and sorts by cost", () => {
    const finesse = applyFilters(ARMORY, state({ picks: { prop: ["finesse"], range: ["melee"] } }, ARMORY)).map((i) => i.id);
    expect(finesse).toEqual(expect.arrayContaining(["dagger", "rapier", "shortsword"]));
    expect(finesse).not.toContain("longsword");
    const heavy = applyFilters(ARMORY, state({ picks: { cat: ["heavy"] } }, ARMORY));
    expect(heavy.every((i) => i.kind === "armor" && i.category === "heavy")).toBe(true);
    const cheapLight = applyFilters(ARMORY, state({ picks: { cost: ["under1"], wt: ["light"] } }, ARMORY));
    expect(cheapLight.length).toBeGreaterThan(0);
    expect(cheapLight.every((i) => i.kind !== "magic" && i.costGp < 1 && i.weight <= 1)).toBe(true);
    // Magic items have no price in the SRD: they come after the equipment.
    const byCost = applyFilters(ARMORY, state({ sort: "cost" }, ARMORY));
    const priced = byCost.filter((i) => i.kind !== "magic");
    expect(byCost.slice(0, priced.length)).toEqual(priced);
    for (let k = 1; k < priced.length; k++) expect(priced[k]!.costGp).toBeGreaterThanOrEqual(priced[k - 1]!.costGp);
    expect(groupOf(ARMORY, state({ sort: "cost" }, ARMORY))).toBeUndefined();
  });

  it("lists magic items with type, rarity and attunement filters (DAG-83)", () => {
    const magic = applyFilters(ARMORY, state({ picks: { kind: ["magic"] } }, ARMORY));
    expect(magic.length).toBe(239);
    const rings = applyFilters(ARMORY, state({ picks: { type: ["ring"], rarity: ["rare"], attune: ["yes"] } }, ARMORY));
    expect(rings.map((i) => i.id)).toContain("ring-of-protection");
    expect(rings.every((i) => i.kind === "magic" && i.type === "ring" && i.rarity === "rare" && !!i.attunement)).toBe(true);
    // An item whose rarity varies matches each of its forms.
    expect(applyFilters(ARMORY, state({ picks: { rarity: ["very rare"], type: ["potion"] } }, ARMORY)).map((i) => i.id)).toContain("potions-of-healing");
    expect(applyFilters(ARMORY, state({ picks: { attune: ["no"] } }, ARMORY)).every((i) => i.kind === "magic" && !i.attunement)).toBe(true);
    const text = encodeFilters(ARMORY, state({ picks: { rarity: ["very rare"], type: ["wondrous item"] } }, ARMORY));
    expect(text).toBe("~type-wondrous_item~rarity-very_rare");
    expect(decodeFilters(ARMORY, text).picks).toEqual({ type: ["wondrous item"], rarity: ["very rare"] });
  });

  it("sorts by rarity, equipment first, grouped by rarity", () => {
    const byRarity = applyFilters(ARMORY, state({ sort: "rarity" }, ARMORY));
    const group = groupOf(ARMORY, state({ sort: "rarity" }, ARMORY))!;
    expect(group(byRarity[0]!)).toBe("Equipment");
    expect(group(byRarity.at(-1)!)).toBe("Artifact");
    const kinds = applyFilters(ARMORY, state({ picks: { kind: ["magic"] } }, ARMORY));
    expect(groupOf(ARMORY, state({}, ARMORY))!(kinds.find((i) => i.id === "bag-of-holding")!)).toBe("Wondrous items");
  });
});
