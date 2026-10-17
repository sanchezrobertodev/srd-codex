import { describe, expect, it } from "vitest";
import { ITEMS, WEAPON_PROPERTY_TEXT, WEAPON_SPECIAL_TEXT } from "@dnd/data";
import { entry, itemById, monsterById, spellById } from "./entries";
import { castersOf, FEATURED, monogram, proficiencyBonus, relatedSpells, rulesBlocks, sensesLabel, similarItems, similarMonsters, wieldersOf } from "./notes";
import { CODEX_CHAPTERS } from "./route";

describe("stat block wording (DAG-78)", () => {
  it("gives the proficiency bonus by challenge rating", () => {
    expect([0, 0.125, 1, 4, 5, 8, 9, 12, 13, 16, 17, 20, 21, 24, 25, 28, 29, 30].map(proficiencyBonus)).toEqual([2, 2, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9]);
  });

  it("writes senses with Perception capitalized", () => {
    expect(sensesLabel(monsterById.get("goblin")!.senses)).toBe("darkvision 60 ft., passive Perception 9");
  });
});

describe("rules text in paragraphs and lists (DAG-78)", () => {
  it("puts a spellcasting list one level per line, apart from its label", () => {
    const mage = monsterById.get("mage")!.traits.find((t) => t.name === "Spellcasting")!;
    const blocks = rulesBlocks(mage.description, true);
    expect(blocks[0]).toMatchObject({ kind: "p" });
    expect(blocks[1]).toMatchObject({ kind: "list" });
    const items = blocks[1]!.kind === "list" ? blocks[1]!.items : [];
    expect(items.map((i) => i.label)).toEqual(["Cantrips (at will)", "1st level (4 slots)", "2nd level (3 slots)", "3rd level (3 slots)", "4th level (3 slots)", "5th level (1 slot)"]);
    expect(items[3]!.text).toBe("counterspell, fireball, fly");
  });

  it("reads innate spellcasting lines too", () => {
    const giant = monsterById.get("cloud-giant")!.traits.find((t) => t.name === "Innate Spellcasting")!;
    const list = rulesBlocks(giant.description, true).find((b) => b.kind === "list");
    expect(list?.kind === "list" && list.items.map((i) => i.label)).toEqual(["At will", "3/day each", "1/day each"]);
  });

  it("keeps a '* ' footnote as a paragraph after the spell list", () => {
    const archmage = monsterById.get("archmage")!.traits.find((t) => t.name === "Spellcasting")!;
    const blocks = rulesBlocks(archmage.description, true);
    expect(blocks.at(-1)).toEqual({ kind: "p", text: "* The archmage casts these spells on itself before combat." });
    const list = blocks.find((b) => b.kind === "list");
    expect(list?.kind === "list" && list.items.some((i) => i.text.includes("mage armor*"))).toBe(true);
  });

  it("reads a paragraph's bold italic name as its lead", () => {
    const flee = rulesBlocks(spellById.get("command")!.description).find((b) => b.kind === "p" && b.lead === "Flee.");
    expect(flee).toMatchObject({ kind: "p", lead: "Flee." });
    expect(flee?.kind === "p" && flee.text.startsWith("The target spends its turn")).toBe(true);
    expect(rulesBlocks("***Round 5-10.*** Gusts.")).toEqual([{ kind: "p", lead: "Round 5-10.", text: "Gusts." }]);
  });

  it("reads a table with its caption (DAG-83)", () => {
    const potions = itemById.get("potions-of-healing")!;
    const table = rulesBlocks(potions.kind === "magic" ? potions.description : "").find((b) => b.kind === "table");
    expect(table).toEqual({
      kind: "table",
      caption: "Potions of Healing",
      head: ["Potion of ...", "Rarity", "HP Regained"],
      rows: [
        ["Healing", "Common", "2d4 + 2"],
        ["Greater healing", "Uncommon", "4d4 + 4"],
        ["Superior healing", "Rare", "8d4 + 8"],
        ["Supreme healing", "Very rare", "10d4 + 20"],
      ],
    });
    expect(rulesBlocks("| a | b |\n|---|---|\n| 1 | 2 |")).toEqual([{ kind: "table", head: ["a", "b"], rows: [["1", "2"]] }]);
  });

  it("keeps ordinary text as paragraphs, and '- ' lines as a list", () => {
    expect(rulesBlocks("One.\n\nTwo.")).toEqual([{ kind: "p", text: "One." }, { kind: "p", text: "Two." }]);
    expect(rulesBlocks("Omens:\n- Weal\n- Woe")).toEqual([{ kind: "p", text: "Omens:" }, { kind: "list", items: [{ text: "Weal" }, { text: "Woe" }] }]);
    // "At will:" outside spellcasting text is just a sentence.
    expect(rulesBlocks("At will: it can do this.")).toEqual([{ kind: "p", text: "At will: it can do this." }]);
  });
});

describe("the notes beside a page (DAG-78)", () => {
  it("finds similar creatures of the same type, nearest challenge first", () => {
    const goblin = monsterById.get("goblin")!;
    const kin = similarMonsters(goblin);
    expect(kin.length).toBe(5);
    expect(kin.every((m) => m.type === goblin.type && m.id !== "goblin")).toBe(true);
    for (let k = 1; k < kin.length; k++) expect(Math.abs(kin[k]!.cr - goblin.cr)).toBeGreaterThanOrEqual(Math.abs(kin[k - 1]!.cr - goblin.cr));
  });

  it("knows which creatures cast a spell", () => {
    const fireball = castersOf("fireball").map((m) => m.id);
    expect(fireball).toEqual(expect.arrayContaining(["mage", "lich"]));
    expect(castersOf("cure-wounds").map((m) => m.id)).toContain("priest");
    expect(relatedSpells(spellById.get("fireball")!).every((s) => s.level === 3 && s.school === "evocation" && s.id !== "fireball")).toBe(true);
  });

  it("knows which creatures fight with an item, and similar items", () => {
    expect(wieldersOf("scimitar").map((m) => m.id)).toContain("goblin");
    // Stat blocks say "Light Crossbow"; the Armory lists "Crossbow, light".
    expect(wieldersOf("crossbow-light").map((m) => m.id)).toEqual(expect.arrayContaining(["assassin", "bandit"]));
    const longsword = itemById.get("longsword")!;
    const like = similarItems(longsword);
    expect(like.every((i) => i.kind === "weapon" && i.category === "martial")).toBe(true);
  });

  it("explains every weapon property in plain words", () => {
    for (const i of ITEMS) {
      if (i.kind !== "weapon") continue;
      for (const p of i.properties) expect(WEAPON_PROPERTY_TEXT[p], `${i.id}: ${p}`).toBeTruthy();
      if (i.properties.includes("special")) expect(WEAPON_SPECIAL_TEXT[i.id], i.id).toBeTruthy();
    }
  });
});

describe("the landing (DAG-78)", () => {
  it("features entries that exist in every chapter", () => {
    for (const c of CODEX_CHAPTERS) {
      expect(FEATURED[c.id].length).toBeGreaterThanOrEqual(6);
      for (const id of FEATURED[c.id]) expect(entry(c.id, id), `${c.id}.${id}`).toBeTruthy();
    }
    expect(monogram("Young Green Dragon")).toBe("YG");
    expect(monogram("Rope, hempen (50 feet)")).toBe("R");
  });
});
