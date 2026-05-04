"use client";

import type { AttackType } from "@/app/components/character/AttackRollModal";
import Button from "@/app/components/shared/Button";
import type { AttackModifierOption } from "@/app/lib/equipCombatUtils";
import { enemyAttackOption } from "../enemyInstanceUtils";

type AttackRow = {
  key: AttackType;
  label: string;
  mod: number;
};

type EnemyInstanceAttackSectionProps = {
  rows: AttackRow[];
  onOpenModal: (
    attackType: AttackType,
    options: AttackModifierOption[]
  ) => void;
};

export function EnemyInstanceAttackSection({
  rows,
  onOpenModal,
}: EnemyInstanceAttackSectionProps) {
  if (rows.length === 0) return null;
  return (
    <section className="rounded border border-black/20 p-4">
      <h2 className="text-sm font-semibold text-black">Attack rolls</h2>
      <p className="mt-1 text-xs text-black/65">
        Opens the same attack roller as characters (extra dice, damage on high
        hits when applicable).
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {rows.map((r) => (
          <Button
            key={r.key}
            type="button"
            variant="secondaryOutlineXs"
            fullWidth={false}
            onClick={() =>
              onOpenModal(r.key, [enemyAttackOption(r.mod, r.label)])
            }
          >
            {r.label} ({r.mod >= 0 ? "+" : ""}
            {r.mod}d10)
          </Button>
        ))}
      </div>
    </section>
  );
}
