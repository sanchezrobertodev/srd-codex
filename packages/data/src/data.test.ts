import { describe, expect, it } from "vitest";
import { classesFile, itemsFile, magicItemsFile, monstersFile, racesFile, spellsFile } from "../schemas";
import { CLASSES, ITEMS, MAGIC_ITEMS, MONSTERS, MVP_CLASSES, MVP_RACES, RACES, SPELLS, STANDARD_ARRAY_BY_CLASS, STARTING_KITS, findItem, getClass, getRace, spellsForClass } from "./index";

describe("generated SRD data", () => {
  it("validates against the schemas", () => {
    expect(() => classesFile.parse(CLASSES)).not.toThrow();
    expect(() => racesFile.parse(RACES)).not.toThrow();
    expect(() => spellsFile.parse(SPELLS)).not.toThrow();
    expect(() => monstersFile.parse(MONSTERS)).not.toThrow();
    expect(() => itemsFile.parse(ITEMS)).not.toThrow();
    expect(() => magicItemsFile.parse(MAGIC_ITEMS)).not.toThrow();
  });

  it("has every MVP class and race", () => {
    for (const id of MVP_CLASSES) expect(getClass(id).id).toBe(id);
    for (const id of MVP_RACES) expect(getRace(id).id).toBe(id);
  });

  it("starting kits reference real items", () => {
    for (const kit of Object.values(STARTING_KITS)) for (const k of kit) expect(findItem(k.itemId), k.itemId).toBeDefined();
  });

  it("casters have slot tables and level-1 spell lists", () => {
    for (const id of ["wizard", "cleric"]) {
      const cls = getClass(id);
      expect(cls.spellcasting?.slots[1]?.[1]).toBe(2);
      expect(cls.spellcasting?.slots[3]?.[2]).toBe(2);
      expect(spellsForClass(id, 1).filter((s) => s.level === 0).length).toBeGreaterThanOrEqual(5);
    }
  });

  it("monsters used in the MVP have parsed attacks", () => {
    for (const id of ["goblin", "wolf", "skeleton", "bandit", "orc", "giant-spider", "ogre", "zombie", "kobold"]) {
      const m = MONSTERS.find((x) => x.id === id);
      expect(m, id).toBeDefined();
      expect(m!.actions.some((a) => a.attack), `${id} attack`).toBe(true);
    }
  });
});

describe("reactions, legendary actions and magic items (DAG-83)", () => {
  it("gives the creatures that have them their reactions", () => {
    expect(MONSTERS.filter((m) => m.reactions?.length).length).toBe(12);
    const captain = MONSTERS.find((m) => m.id === "bandit-captain")!;
    expect(captain.reactions?.map((r) => r.name)).toEqual(["Parry"]);
    expect(captain.reactions?.[0]?.description).toMatch(/adds 2 to its AC against one melee attack/);
  });

  it("gives legendary creatures their legendary actions and the paragraph that introduces them", () => {
    const legendary = MONSTERS.filter((m) => m.legendary);
    expect(legendary.length).toBe(32);
    expect(legendary.every((m) => m.legendary!.uses === 3 && m.legendary!.actions.length >= 3)).toBe(true);
    const dragon = MONSTERS.find((m) => m.id === "adult-red-dragon")!.legendary!;
    expect(dragon.actions.map((a) => a.name)).toEqual(["Detect", "Tail Attack", "Wing Attack (Costs 2 Actions)"]);
    expect(dragon.description).toMatch(/^The dragon can take 3 legendary actions, choosing from the options below\./);
    expect(dragon.description).toMatch(/The dragon regains spent legendary actions at the start of its turn\.$/);
    expect(MONSTERS.find((m) => m.id === "mummy-lord")!.legendary!.description).toMatch(/^The mummy lord can take 3/);
    expect(MONSTERS.find((m) => m.id === "goblin")!.legendary).toBeUndefined();
  });

  it("imports the SRD magic items, apart from the engine's items", () => {
    expect(MAGIC_ITEMS.length).toBe(239);
    const count = (r: string) => MAGIC_ITEMS.filter((i) => i.rarity === r).length;
    expect([count("common"), count("uncommon"), count("rare"), count("very rare"), count("legendary"), count("artifact"), count("varies")]).toEqual([1, 69, 79, 51, 27, 1, 11]);
    const ids = new Set(ITEMS.map((i) => i.id));
    expect(MAGIC_ITEMS.filter((i) => ids.has(i.id))).toEqual([]);
    expect(new Set(MAGIC_ITEMS.map((i) => i.id)).size).toBe(MAGIC_ITEMS.length);
    const staff = MAGIC_ITEMS.find((i) => i.id === "staff-of-power")!;
    expect(staff).toMatchObject({ type: "staff", rarity: "very rare", attunement: "by a sorcerer, warlock, or wizard" });
    expect(MAGIC_ITEMS.find((i) => i.id === "bag-of-holding")).toMatchObject({ type: "wondrous item", rarity: "uncommon" });
    expect(MAGIC_ITEMS.find((i) => i.id === "bag-of-holding")!.attunement).toBeUndefined();
    expect(MAGIC_ITEMS.find((i) => i.id === "cloak-of-protection")!.attunement).toBe(true);
    // The magic Potion of Healing is the table of all four; the engine keeps its own potion.
    expect(MAGIC_ITEMS.find((i) => i.id === "potions-of-healing")).toMatchObject({ rarity: "varies", rarities: ["common", "uncommon", "rare", "very rare"] });
    expect(MAGIC_ITEMS.find((i) => i.id === "bracers-of-defense")!.heading).toMatch(/^Wondrous item, rare/);
  });

  it("keeps an attunement that only one property needs", () => {
    // The heading says nothing, but Giant's Bane requires attunement.
    expect(MAGIC_ITEMS.find((i) => i.id === "hammer-of-thunderbolts")!.attunement).toBe("for its Giant's Bane property");
  });

  it("splits the table rows the source folds into the row above", () => {
    const rows = (id: string) => MAGIC_ITEMS.find((i) => i.id === id)!.description.split("\n").filter((l) => l.startsWith("|"));
    const wand = rows("wand-of-wonder");
    expect(wand).toContain("| 11-15 | You are stunned until the start of your next turn, believing something awesome just happened. |");
    expect(wand).toContain("| 16-20 | You cast gust of wind. |");
    const robe = rows("robe-of-useful-items");
    expect(robe).toContain("| 31-44 | Wooden ladder (24 feet long) |");
    expect(robe).toContain("| 45-51 | A riding horse with saddle bags |");
    // No roll range is left inside another row's text.
    for (const i of MAGIC_ITEMS) for (const l of rows(i.id)) expect(l, i.id).not.toMatch(/\.\s\d{1,3}-\d{1,3}\s[A-Z]/);
  });
});

describe("standard array by class (SRD 5.2.1, DAG-48)", () => {
  it("places the standard array once for every class, its highest score in a primary ability", () => {
    expect(Object.keys(STANDARD_ARRAY_BY_CLASS).sort()).toEqual(CLASSES.map((c) => c.id).sort());
    for (const c of CLASSES) {
      const placed = STANDARD_ARRAY_BY_CLASS[c.id]!;
      expect(Object.values(placed).sort((a, b) => a - b)).toEqual([8, 10, 12, 13, 14, 15]);
      const best = (Object.keys(placed) as (keyof typeof placed)[]).find((a) => placed[a] === 15)!;
      expect(c.primaryAbilities).toContain(best);
    }
  });
});
