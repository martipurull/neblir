"use client";

import Button from "@/app/components/shared/Button";
import type {
  EnemyInstanceDetailResponse,
  EnemyInstancePatch,
} from "@/lib/api/enemyInstances";
import { enemyStatusLabel } from "../enemyInstanceUtils";

type EnemyInstanceHpCardProps = {
  enemy: EnemyInstanceDetailResponse;
  hpStyles: {
    bar: string;
    track: string;
    text: string;
  } | null;
  hpPct: number;
  canDamage: boolean;
  applyEnemyPatch: (
    build: (prev: EnemyInstanceDetailResponse) => EnemyInstancePatch
  ) => void;
  applyHealthDelta: (delta: number) => void;
  spendReaction: () => void;
};

export function EnemyInstanceHpCard({
  enemy,
  hpStyles,
  hpPct,
  canDamage,
  applyEnemyPatch,
  applyHealthDelta,
  spendReaction,
}: EnemyInstanceHpCardProps) {
  return (
    <div className="rounded border border-black/20 p-4 text-black">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p
            className={`text-sm font-semibold tabular-nums ${hpStyles?.text ?? ""}`}
          >
            HP {enemy.currentHealth}/{enemy.maxHealth}
            <span className="ml-2 text-black/60">({hpPct}%)</span>
          </p>
          <div
            className={`mt-2 h-2.5 w-full max-w-md overflow-hidden rounded-full ${hpStyles?.track ?? ""}`}
            role="progressbar"
            aria-valuenow={enemy.currentHealth}
            aria-valuemin={0}
            aria-valuemax={enemy.maxHealth}
          >
            <div
              className={`h-full rounded-full transition-all ${hpStyles?.bar ?? ""}`}
              style={{
                width: `${enemy.maxHealth > 0 ? Math.min(100, hpPct) : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-black/60">
          HP
        </span>
        <Button
          type="button"
          variant="modalIconStepper"
          fullWidth={false}
          disabled={!canDamage}
          aria-label="Subtract 5 HP"
          onClick={() => applyHealthDelta(-5)}
        >
          −5
        </Button>
        <Button
          type="button"
          variant="modalIconStepper"
          fullWidth={false}
          disabled={!canDamage}
          aria-label="Subtract 1 HP"
          onClick={() => applyHealthDelta(-1)}
        >
          −1
        </Button>
        <Button
          type="button"
          variant="modalIconStepper"
          fullWidth={false}
          aria-label="Add 1 HP"
          onClick={() =>
            applyEnemyPatch((cur) => ({
              currentHealth: Math.min(cur.maxHealth, cur.currentHealth + 1),
              status: "ACTIVE",
            }))
          }
        >
          +1
        </Button>
        <Button
          type="button"
          variant="modalIconStepper"
          fullWidth={false}
          aria-label="Add 5 HP"
          onClick={() =>
            applyEnemyPatch((cur) => ({
              currentHealth: Math.min(cur.maxHealth, cur.currentHealth + 5),
              status: "ACTIVE",
            }))
          }
        >
          +5
        </Button>
      </div>

      <div className="mt-4 border-t border-black/10 pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-black/60">
          Status
        </h3>
        <p className="mt-2 text-sm text-black">
          Current:{" "}
          <span className="font-semibold tabular-nums">
            {enemyStatusLabel(enemy.status)}
          </span>
        </p>
        <p className="mt-1 text-xs text-black/60">
          Use the buttons below to update status anytime, or open Edit instance
          for full details.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondaryOutlineXs"
            fullWidth={false}
            disabled={enemy.status === "ACTIVE"}
            onClick={() => applyEnemyPatch(() => ({ status: "ACTIVE" }))}
          >
            Set active
          </Button>
          <Button
            type="button"
            variant="secondaryOutlineXs"
            fullWidth={false}
            disabled={enemy.status === "DEFEATED"}
            onClick={() => applyEnemyPatch(() => ({ status: "DEFEATED" }))}
          >
            Set defeated
          </Button>
          <Button
            type="button"
            variant="secondaryOutlineXs"
            fullWidth={false}
            disabled={enemy.status === "DEAD"}
            onClick={() => applyEnemyPatch(() => ({ status: "DEAD" }))}
          >
            Set dead
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-black/10 pt-4 sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-black/60">
            Reactions
          </span>
          <p className="tabular-nums">
            <span className="text-2xl font-bold tracking-tight text-black sm:text-3xl">
              {enemy.reactionsRemaining}
            </span>
            <span className="text-base font-semibold text-black/45 sm:text-lg">
              {" "}
              / {enemy.reactionsPerRound}
            </span>
            <span className="ml-2 text-sm font-medium text-black/55">
              left this round
            </span>
          </p>
        </div>
        <Button
          type="button"
          variant="modalIconStepper"
          fullWidth={false}
          disabled={enemy.reactionsRemaining <= 0}
          aria-label="Spend one reaction"
          onClick={spendReaction}
        >
          −1
        </Button>
      </div>
    </div>
  );
}
