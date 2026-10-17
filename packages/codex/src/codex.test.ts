import { describe, expect, it } from "vitest";
import { CONDITION_TEXT, DAMAGE_TYPE_TEXT, MONSTERS } from "@dnd/data";
import { CONDITIONS, DAMAGE_TYPES } from "@dnd/shared";
import { entryFacts, isSpellcasting, itemForAction, linkRules, matchScore, monsterById, searchCodex } from "./entries";
import { chapterSelection, codexHref, parseCodexHash } from "./route";

describe("Codex links (DAG-76)", () => {
  it("reads and writes a bare hash token per chapter and entry", () => {
    expect(parseCodexHash("#bestiary.goblin")).toEqual({ chapter: "bestiary", id: "goblin", filters: "" });
    expect(parseCodexHash("#spells.cure-wounds")).toEqual({ chapter: "spells", id: "cure-wounds", filters: "" });
    expect(parseCodexHash("armory")).toEqual({ chapter: "armory", id: null, filters: "" });
    expect(codexHref("spells", "fireball")).toBe("#spells.fireball");
    expect(codexHref("armory")).toBe("#armory");
    // Anything else isn't a Codex link: the game's own hashes, other text.
    expect(parseCodexHash("")).toBeNull();
    expect(parseCodexHash("#settings")).toBeNull();
    expect(parseCodexHash("#bestiary/goblin")).toBeNull();
    expect(parseCodexHash("#bestiary.Goblin")).toBeNull();
  });

  it("lets a chapter browser used on its own follow the hash to its own entries only", () => {
    expect(chapterSelection("bestiary", parseCodexHash("#bestiary.goblin"))).toBe("goblin");
    expect(chapterSelection("spells", parseCodexHash("#bestiary.goblin"))).toBeNull();
    expect(chapterSelection("armory", parseCodexHash("#armory"))).toBeNull();
    expect(chapterSelection("armory", null)).toBeNull();
  });
});

describe("search across chapters (DAG-76)", () => {
  it("ranks the whole name, then its start, then the start of a word, then anywhere", () => {
    expect(matchScore("Fireball", "fireball")).toBe(0);
    expect(matchScore("Fire Bolt", "fire")).toBe(1);
    expect(matchScore("Delayed Blast Fireball", "fire")).toBe(2);
    expect(matchScore("Giant Fire Beetle", "fire")).toBe(2);
    expect(matchScore("Bonfire", "fire")).toBe(3);
    expect(matchScore("Goblin", "fire")).toBe(-1);
    expect(matchScore("Goblin", "  ")).toBe(-1);
  });

  it("groups hits by chapter, best group first, each with its short facts", () => {
    const groups = searchCodex("fire");
    expect(groups.map((g) => g.chapter)).toEqual(expect.arrayContaining(["bestiary", "spells"]));
    const spells = groups.find((g) => g.chapter === "spells")!;
    expect(spells.hits[0]!.name).toMatch(/^Fire/);
    expect(spells.hits.length).toBeLessThanOrEqual(8);
    // An exact name puts its chapter first.
    expect(searchCodex("goblin")[0]!.chapter).toBe("bestiary");
    expect(searchCodex("goblin")[0]!.hits[0]).toMatchObject({ id: "goblin", facts: "CR 1/4 · Small humanoid" });
    expect(searchCodex("longsword")[0]!.hits[0]).toMatchObject({ chapter: "armory", id: "longsword" });
    expect(searchCodex("zzzz")).toEqual([]);
    expect(entryFacts("spells", "fireball")).toBe("3rd-level evocation");
  });
});

describe("links inside rules text (DAG-76)", () => {
  it("links the spells a spellcaster names, and explains conditions and damage types", () => {
    const mage = monsterById.get("mage")!;
    const casting = mage.traits.find((t) => isSpellcasting(t.name))!;
    const runs = linkRules(casting.description, { spells: true });
    const spells = runs.flatMap((r) => (typeof r !== "string" && r.kind === "spell" ? [r.id] : []));
    expect(spells).toEqual(expect.arrayContaining(["fire-bolt", "mage-armor", "fireball", "counterspell", "cone-of-cold"]));
    // The text reads the same with the links taken out.
    expect(runs.map((r) => (typeof r === "string" ? r : r.text)).join("")).toBe(casting.description);

    const bite = linkRules("Hit: 7 (2d6) fire damage, and the target is grappled and poisoned.");
    expect(bite.filter((r) => typeof r !== "string")).toEqual([
      { kind: "damage", id: "fire", text: "fire" },
      { kind: "condition", id: "grappled", text: "grappled" },
      { kind: "condition", id: "poisoned", text: "poisoned" },
    ]);
  });

  it("leaves ordinary words alone outside spellcasting, and damage types that aren't damage", () => {
    const runs = linkRules("In bright light it is blinded; a cold wind blows.", { spells: false });
    expect(runs.filter((r) => typeof r !== "string")).toEqual([{ kind: "condition", id: "blinded", text: "blinded" }]);
    // Spell names that are common words only link in spellcasting text.
    expect(linkRules("It sheds bright light.", { spells: true }).some((r) => typeof r !== "string" && r.id === "light")).toBe(true);
    expect(linkRules("It sheds bright light.").some((r) => typeof r !== "string")).toBe(false);
  });

  it("finds the Armory item a monster's action is named after", () => {
    expect(itemForAction("Longsword")).toBe("longsword");
    expect(itemForAction("Light Crossbow")).toBe("crossbow-light");
    expect(itemForAction("Bite")).toBeUndefined();
    const linked = MONSTERS.flatMap((m) => m.actions.map((a) => itemForAction(a.name))).filter(Boolean);
    expect(linked.length).toBeGreaterThan(40);
  });

  it("has a reminder for every condition and damage type", () => {
    for (const c of CONDITIONS) expect(CONDITION_TEXT[c]).toMatch(/\w/);
    for (const d of DAMAGE_TYPES) expect(DAMAGE_TYPE_TEXT[d]).toMatch(/\w/);
  });
});
