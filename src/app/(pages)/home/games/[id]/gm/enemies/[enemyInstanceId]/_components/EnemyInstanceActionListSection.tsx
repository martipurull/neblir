"use client";

import Button from "@/app/components/shared/Button";
import type { EnemyInstanceDetailResponse } from "@/lib/api/enemyInstances";

type ActionRow = EnemyInstanceDetailResponse["actions"][number];

type EnemyInstanceActionListSectionProps = {
  title: string;
  emptyMessage: string;
  actions: ActionRow[];
  onRollToHit: (actionName: string, dice: number) => void;
  onRollDamage: (
    actionName: string,
    n: number,
    sides: number,
    damageType?: string | null
  ) => void;
};

export function EnemyInstanceActionListSection({
  title,
  emptyMessage,
  actions,
  onRollToHit,
  onRollDamage,
}: EnemyInstanceActionListSectionProps) {
  return (
    <section className="rounded border border-black/20 p-4">
      <h2 className="text-sm font-semibold text-black">{title}</h2>
      {actions.length === 0 ? (
        <p className="mt-2 text-sm text-black/70">{emptyMessage}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {actions.map((a, idx) => (
            <li
              key={`${a.name}-${idx}`}
              className="rounded border border-black/10 p-3"
            >
              <p className="font-medium text-black">{a.name}</p>
              {a.description ? (
                <div
                  className="character-note-html mt-1 text-sm text-black/85"
                  dangerouslySetInnerHTML={{ __html: a.description }}
                />
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {a.numberOfDiceToHit ? (
                  <Button
                    type="button"
                    variant="secondaryOutlineXs"
                    fullWidth={false}
                    onClick={() =>
                      onRollToHit(a.name, a.numberOfDiceToHit ?? 1)
                    }
                  >
                    Roll to hit ({a.numberOfDiceToHit}d10)
                  </Button>
                ) : null}
                {a.numberOfDamageDice && a.damageDiceType ? (
                  <Button
                    type="button"
                    variant="secondaryOutlineXs"
                    fullWidth={false}
                    onClick={() =>
                      onRollDamage(
                        a.name,
                        a.numberOfDamageDice ?? 1,
                        a.damageDiceType ?? 6,
                        a.damageType
                      )
                    }
                  >
                    Roll damage ({a.numberOfDamageDice}d{a.damageDiceType})
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
