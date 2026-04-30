"use client";

import Button from "@/app/components/shared/Button";
type ItemDetailUsesSectionProps = {
  displayUses: number;
  maxUses: number;
  onDelta: (delta: number) => void;
  /** When false, the + control is disabled (e.g. broken / beyond repair). */
  allowIncrease?: boolean;
};

export function ItemDetailUsesSection({
  displayUses,
  maxUses,
  onDelta,
  allowIncrease = true,
}: ItemDetailUsesSectionProps) {
  return (
    <div className="mt-3 flex flex-col gap-2 rounded border border-white/20 p-3">
      <span className="block text-xs font-medium uppercase tracking-wider text-white/70">
        Uses
      </span>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="modalIconStepperLg"
          fullWidth={false}
          onClick={() => onDelta(-1)}
          disabled={displayUses <= 0}
          aria-label="Decrease uses"
        >
          −
        </Button>
        <span className="min-w-[4rem] text-center text-lg font-semibold tabular-nums text-white">
          {displayUses} / {maxUses}
        </span>
        <Button
          type="button"
          variant="modalIconStepperLg"
          fullWidth={false}
          onClick={() => onDelta(1)}
          disabled={displayUses >= maxUses || !allowIncrease}
          aria-label="Increase uses"
        >
          +
        </Button>
      </div>
      <p className="text-xs text-white/60">
        {allowIncrease
          ? "Changes save automatically after a short delay."
          : "Damaged items cannot hold charges. Set status to functional first."}
      </p>
    </div>
  );
}
