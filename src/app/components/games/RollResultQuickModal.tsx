"use client";

import Button from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { useMemo } from "react";

export type RollHighlightMode = "d10" | "plain";

type RollResultQuickModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  results: number[];
  /** d10: 8–10 neblirSafe, 1 neblirDanger; plain: only 1 highlighted danger */
  highlightMode: RollHighlightMode;
  totalLabel?: string;
  total?: number;
};

function spanClassForValue(value: number, mode: RollHighlightMode): string {
  if (mode === "d10") {
    const isSuccess = value >= 8;
    const isTen = value === 10;
    const isOne = value === 1;
    const colorClass = isSuccess
      ? "text-neblirSafe-600"
      : isOne
        ? "text-neblirDanger-400"
        : "text-white";
    const boldClass = isTen ? "font-bold" : "";
    return [colorClass, boldClass].filter(Boolean).join(" ");
  }
  if (value === 1) return "text-neblirDanger-400 font-semibold";
  return "text-white";
}

export function RollResultQuickModal({
  isOpen,
  onClose,
  title,
  subtitle,
  results,
  highlightMode,
  totalLabel,
  total,
}: RollResultQuickModalProps) {
  const orderedResults = useMemo(
    () => [...results].sort((a, b) => b - a),
    [results]
  );

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title={title}
      titleId="roll-result-quick-title"
      maxWidthClass="max-w-sm"
      footer={
        <Button
          type="button"
          variant="modalFooterPrimary"
          fullWidth={false}
          onClick={onClose}
        >
          OK
        </Button>
      }
    >
      <div className="space-y-3">
        {subtitle ? <p className="text-sm text-white/80">{subtitle}</p> : null}
        <div className="rounded border border-white/30 bg-black/20 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/80">
            Result
          </p>
          <p className="flex flex-wrap gap-x-2 gap-y-0.5 text-lg tabular-nums">
            {orderedResults.map((value, i) => (
              <span key={i} className={spanClassForValue(value, highlightMode)}>
                {value}
                {i < orderedResults.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
          {total != null ? (
            <p className="mt-2 text-sm text-white/90">
              {totalLabel ?? "Total"}:{" "}
              <span className="font-semibold tabular-nums">{total}</span>
            </p>
          ) : null}
        </div>
      </div>
    </ModalShell>
  );
}
