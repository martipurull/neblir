// eslint-disable-next-line no-unused-expressions
"use client";

import React from "react";

export type StatEditType = "physical" | "mental" | "armour";

export interface StatEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: StatEditType;
  /** Current HP value */
  currentHP: number;
  /** Max HP (0 for armour when no armour) */
  maxHP: number;
  /** Serious injuries (physical only), 0–3 */
  seriousInjuries?: number;
  /** Serious trauma (mental only), 0–3 */
  seriousTrauma?: number;
  onUpdate: (updates: {
    currentHP?: number;
    seriousInjuries?: number;
    seriousTrauma?: number;
  }) => void;
}

function QuickAdjustRow({
  label,
  value,
  min,
  max,
  onAdjust,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onAdjust: (delta: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-white">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAdjust(-1)}
          disabled={value <= min}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-white bg-transparent text-lg font-bold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="min-w-[2.5rem] text-center text-sm font-bold text-white">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onAdjust(1)}
          disabled={value >= max}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-white bg-transparent text-lg font-bold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function StatEditModal({
  isOpen,
  onClose,
  type,
  currentHP,
  maxHP,
  seriousInjuries = 0,
  seriousTrauma = 0,
  onUpdate,
}: StatEditModalProps) {
  if (!isOpen) return null;

  const title =
    type === "physical" ? "Physical" : type === "mental" ? "Mental" : "Armour";

  const handleHPAdjust = (delta: number) => {
    const newHP = Math.max(0, Math.min(maxHP, currentHP + delta));
    if (newHP !== currentHP) {
      onUpdate({ currentHP: newHP });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stat-edit-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border-2 border-white bg-modalBackground-200 p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2
            id="stat-edit-modal-title"
            className="text-lg font-semibold text-white"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white transition-colors hover:bg-white/10"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {maxHP > 0 && (
            <QuickAdjustRow
              label="HP"
              value={currentHP}
              min={0}
              max={maxHP}
              onAdjust={handleHPAdjust}
            />
          )}

          {type === "physical" && (
            <QuickAdjustRow
              label="Serious injuries"
              value={seriousInjuries}
              min={0}
              max={3}
              onAdjust={(delta) => {
                const newVal = Math.max(
                  0,
                  Math.min(3, seriousInjuries + delta)
                );
                if (newVal !== seriousInjuries) {
                  onUpdate({ seriousInjuries: newVal });
                }
              }}
            />
          )}

          {type === "mental" && (
            <QuickAdjustRow
              label="Trauma"
              value={seriousTrauma}
              min={0}
              max={3}
              onAdjust={(delta) => {
                const newVal = Math.max(0, Math.min(3, seriousTrauma + delta));
                if (newVal !== seriousTrauma) {
                  onUpdate({ seriousTrauma: newVal });
                }
              }}
            />
          )}

          {type === "armour" && maxHP <= 0 && (
            <p className="text-sm text-white/80">No armour equipped.</p>
          )}
        </div>
      </div>
    </div>
  );
}
