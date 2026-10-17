import type { DamageType, MonsterAction } from "@dnd/shared";
import { DAMAGE_TYPES } from "@dnd/shared";

/** Read only the immediate hit, not alternate versatile dice or damage behind a save (DAG-119). */
export function parseMonsterAttack(description: string): MonsterAction["attack"] {
  const hit = /(?:Melee|Ranged)(?: or Ranged)? (?:Weapon|Spell) Attack:\s*\+(\d+) to hit/i.exec(description);
  if (!hit) return undefined;
  const reach = /reach (\d+) ft/.exec(description);
  const range = /range (\d+)(?:\/(\d+))? ft/.exec(description);
  const immediate = description.split(/Hit:\s*/i)[1]?.split(/\.(?:\s|$)/)[0]?.split(/,?\s+or\s+|,?\s+and the target must|,\s*(?=\d+\s*\()/i)[0] ?? "";
  const damage = [...immediate.matchAll(/(?:\d+\s*\(([^)]+)\)|(\d+))\s+(\w+) damage/g)].flatMap((m) => {
    const type = m[3] as DamageType;
    return DAMAGE_TYPES.includes(type) ? [{ dice: (m[1] ?? m[2]!).replace(/\s/g, ""), type }] : [];
  });
  return { toHit: Number(hit[1]), ...(reach ? { reach: Number(reach[1]) } : {}), ...(range ? { range: { normal: Number(range[1]), long: Number(range[2] ?? range[1]) } } : {}), damage };
}
