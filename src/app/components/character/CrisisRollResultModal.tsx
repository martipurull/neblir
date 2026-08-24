"use client";

import { Button } from "@/app/components/shared/Button";

export type CrisisRollResult = {
  kind: "death" | "madness";
  success: boolean;
  dice: number[];
  successes: number;
  failures: number;
};

type CrisisRollResultModalProps = {
  result: CrisisRollResult | null;
  onClose: () => void;
};

export function CrisisRollResultModal({
  result,
  onClose,
}: CrisisRollResultModalProps) {
  if (result == null) return null;

  const title = result.kind === "death" ? "Death roll" : "Madness roll";
  const outcomeLabel = result.success ? "Success" : "Failure";
  const outcomeClass = result.success
    ? "text-neblirSafe-600"
    : "text-neblirDanger-600";
  const outcomeBorder = result.success
    ? "border-neblirSafe-400 bg-neblirSafe-200/40"
    : "border-neblirDanger-400 bg-neblirDanger-200/40";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crisis-roll-result-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-lg border border-black bg-paleBlue/95 shadow-lg backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-black/15 px-5 pb-3 pt-5 sm:px-6 sm:pb-4 sm:pt-6">
          <h2
            id="crisis-roll-result-title"
            className="text-lg font-semibold text-black"
          >
            {title}
          </h2>
          <Button
            type="button"
            variant="modalCloseLight"
            fullWidth={false}
            className="!text-black"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          <div
            className={`rounded-lg border-2 px-4 py-5 text-center ${outcomeBorder}`}
          >
            <p
              className={`font-sarpanch text-3xl font-bold uppercase tracking-wide ${outcomeClass}`}
            >
              {outcomeLabel}
            </p>
            <p className="mt-1 text-sm text-black/70">
              {result.success
                ? "One success box is marked."
                : "One failure box is marked."}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-black/60">
              Dice ({result.dice.length}d10)
            </p>
            <div className="flex flex-wrap gap-2">
              {result.dice.map((die, index) => {
                const isHit = die >= 8;
                return (
                  <span
                    key={`${index}-${die}`}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded border text-base font-bold ${
                      isHit
                        ? "border-neblirSafe-400 bg-neblirSafe-200/50 text-neblirSafe-600"
                        : "border-black/20 bg-white/40 text-black"
                    }`}
                  >
                    {die}
                  </span>
                );
              })}
            </div>
          </div>

          <p className="text-sm text-black/80">
            Track:{" "}
            <span className="font-semibold text-neblirSafe-600">
              {result.successes} success
              {result.successes === 1 ? "" : "es"}
            </span>
            {" · "}
            <span className="font-semibold text-neblirDanger-600">
              {result.failures} failure{result.failures === 1 ? "" : "s"}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 justify-end border-t border-black/15 px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant={result.success ? "lightSafePrimary" : "danger"}
            fullWidth={false}
            className="!px-4 !py-2"
            onClick={onClose}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
