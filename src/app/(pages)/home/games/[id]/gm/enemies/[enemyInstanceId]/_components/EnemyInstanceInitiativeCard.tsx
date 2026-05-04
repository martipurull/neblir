"use client";

import Button from "@/app/components/shared/Button";
import type { GameDetail } from "@/app/lib/types/game";

type InitiativeEntry = NonNullable<
  NonNullable<GameDetail["initiativeOrder"]>[number]
>;

type EnemyInstanceInitiativeCardProps = {
  initiativeEntry: InitiativeEntry | null;
  initiativeAdjustBusy: boolean;
  onOpenInitiativeList: () => void;
  onAdjustTotal: (delta: number) => void;
};

export function EnemyInstanceInitiativeCard({
  initiativeEntry,
  initiativeAdjustBusy,
  onOpenInitiativeList,
  onAdjustTotal,
}: EnemyInstanceInitiativeCardProps) {
  return (
    <div className="relative rounded border border-black/20 p-4 text-black">
      <div className="absolute right-3 top-3 z-10 flex items-start gap-2">
        <Button
          type="button"
          variant="secondaryOutlineXs"
          fullWidth={false}
          onClick={onOpenInitiativeList}
          className="shrink-0"
        >
          Initiative list
        </Button>
        {initiativeEntry ? (
          <div
            className="flex w-fit shrink-0 flex-col items-end rounded-md border border-black/30 bg-paleBlue/85 px-2 py-1 shadow-sm"
            role="status"
            aria-label={`Total initiative ${initiativeEntry.totalInitiative}`}
          >
            <p className="text-[9px] font-semibold uppercase leading-none tracking-wide text-black/50">
              Total
            </p>
            <p className="mt-0.5 text-xl font-bold leading-none tabular-nums text-black sm:text-2xl">
              {initiativeEntry.totalInitiative}
            </p>
          </div>
        ) : null}
      </div>

      <div
        className={
          initiativeEntry
            ? "pr-[12.5rem] sm:pr-[14rem]"
            : "pr-[9.5rem] sm:pr-[10.5rem]"
        }
      >
        <h2 className="text-sm font-semibold text-black">
          Initiative in this game
        </h2>
        {initiativeEntry ? (
          <>
            <p className="mt-2 text-xs text-black/65">
              d10 roll + stored modifier (same as GM initiative list). Use −1 /
              +1 to nudge the modifier for this encounter&apos;s order.
            </p>
            <p className="mt-2 text-sm tabular-nums text-black">
              Rolled{" "}
              <span className="font-semibold">
                {initiativeEntry.rolledValue}
              </span>
              {" · "}
              Modifier{" "}
              <span className="font-semibold">
                {initiativeEntry.initiativeModifier >= 0 ? "+" : ""}
                {initiativeEntry.initiativeModifier}
              </span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondaryOutlineXs"
                fullWidth={false}
                disabled={initiativeAdjustBusy}
                onClick={() => void onAdjustTotal(-1)}
              >
                −1 total
              </Button>
              <Button
                type="button"
                variant="secondaryOutlineXs"
                fullWidth={false}
                disabled={initiativeAdjustBusy}
                onClick={() => void onAdjustTotal(1)}
              >
                +1 total
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-2 text-xs text-black/65">
            No initiative submitted for this instance in the current game yet.
            Use &quot;Roll initiative&quot; above when you&apos;re ready.
          </p>
        )}
      </div>
    </div>
  );
}
