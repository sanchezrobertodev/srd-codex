/** Preserve resources omitted by the original SRD importer (DAG-119). Uses the same local raw source. */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { MonsterData, MonsterAction } from "@dnd/shared";
type Raw = { index: string; challenge_rating: number; senses?: Record<string, string | number>; actions?: { name: string; usage?: MonsterAction["usage"] }[]; special_abilities?: { name: string; usage?: MonsterAction["usage"]; spellcasting?: NonNullable<MonsterData["spellcasting"]>[number] }[] };
const input = process.argv[2] ?? fileURLToPath(new URL("../raw/Monsters.json", import.meta.url));
const monsters = JSON.parse(readFileSync(input, "utf8")) as Raw[];
const out = Object.fromEntries(monsters.filter((m) => m.challenge_rating <= 2).flatMap((m) => {
  const usage = Object.fromEntries([...(m.actions ?? []), ...(m.special_abilities ?? [])].filter((a) => a.usage).map((a) => [a.name, a.usage]));
  const spellcasting = (m.special_abilities ?? []).flatMap((a) => a.spellcasting ? [a.spellcasting] : []);
  const blindBeyondBlindsight = String(m.senses?.blindsight ?? "").includes("blind beyond");
  return Object.keys(usage).length || spellcasting.length || blindBeyondBlindsight ? [[m.index, { usage, spellcasting, ...(blindBeyondBlindsight ? { blindBeyondBlindsight: true } : {}) }]] : [];
}));
writeFileSync(new URL("../src/generated/monster-abilities.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
