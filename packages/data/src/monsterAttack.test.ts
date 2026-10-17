import { expect, it } from "vitest";
import { parseMonsterAttack } from "./monsterAttack";
import { getMonster } from "./index";

it("parses versatile weapons without adding their alternative damage", () => {
  expect(getMonster("hobgoblin").actions.find((a) => a.name === "Longsword")!.attack?.damage).toEqual([{ dice: "1d8+1", type: "slashing" }]);
  expect(getMonster("druid").actions.find((a) => a.name === "Quarterstaff")!.attack?.damage).toEqual([{ dice: "1d6", type: "bludgeoning" }]);
  expect(getMonster("gnoll").actions.find((a) => a.name === "Spear")!.attack).toMatchObject({ toHit: 4, reach: 5, range: { normal: 20, long: 60 }, damage: [{ dice: "1d6+2", type: "piercing" }] });
});
it("separates immediate damage from poison saves and supports non-damaging attacks", () => {
  expect(parseMonsterAttack("Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage. The target takes 9 (2d8) poison damage on a failed save.")!.damage).toEqual([{ dice: "1d6+2", type: "piercing" }]);
  expect(parseMonsterAttack("Ranged Weapon Attack: +5 to hit, range 30/60 ft., one creature. Hit: The target is restrained.")!.damage).toEqual([]);
});
it("retains Recharge thresholds, daily uses, slots and innate spell uses", () => {
  expect(getMonster("ankheg").actions.find((a) => a.name === "Acid Spray")!.usage).toMatchObject({ type: "recharge on roll", dice: "1d6", min_value: 6 });
  expect(getMonster("dretch").actions.find((a) => a.name === "Fetid Cloud")!.usage).toMatchObject({ type: "per day", times: 1 });
  expect(getMonster("boar").traits.find((a) => a.name === "Relentless")!.usage).toMatchObject({ type: "recharge after rest", rest_types: ["short", "long"] });
  expect(getMonster("priest").spellcasting![0]).toMatchObject({ dc: 13, slots: { "1": 4, "2": 3, "3": 2 } });
  expect(getMonster("dryad").spellcasting![0]!.spells.find((s) => s.name === "Entangle")!.usage).toEqual({ type: "per day", times: 3 });
});
it("keeps the roll of weapon attacks whose hit only restrains or grapples (DAG-119)", () => {
  expect(getMonster("giant-spider").actions.find((a) => a.name === "Web")!.attack).toEqual({ toHit: 5, range: { normal: 30, long: 60 }, damage: [] });
  expect(getMonster("rug-of-smothering").actions.find((a) => a.name === "Smother")!.attack).toEqual({ toHit: 5, reach: 5, damage: [] });
});
