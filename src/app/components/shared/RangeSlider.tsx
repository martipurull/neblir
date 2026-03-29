"use client";

import React from "react";

export type RangeSliderProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** Allowed range (enforced via clamping). */
  allowedMin?: number;
  allowedMax?: number;
  /** Visual range for the slider track. Defaults to 1..5. */
  visualMin?: number;
  visualMax?: number;
  /** Step for the slider. Defaults to 1. */
  step?: number;
  /** Optional helper label shown next to the main label (e.g. "(race +1)") */
  labelSuffix?: string;
  /** When true, show 1..5 tick labels above the slider. */
  showTicks?: boolean;
  /** Values outside allowed range are greyed out in ticks. */
  disableOutOfRangeTicks?: boolean;
  /** Show red styling (e.g. over-allocation). */
  error?: boolean;
  /** Optional wrapper class for layout. */
  className?: string;
};

export function RangeSlider({
  id,
  label,
  value,
  onChange,
  allowedMin = 1,
  allowedMax = 5,
  visualMin = 1,
  visualMax = 5,
  step = 1,
  labelSuffix,
  showTicks = true,
  disableOutOfRangeTicks = true,
  error = false,
  className = "",
}: RangeSliderProps) {
  const clampedValue = Math.min(allowedMax, Math.max(allowedMin, value));
  const displayLabel = labelSuffix ? `${label} ${labelSuffix}` : label;

  return (
    <div
      className={`rounded-md border border-black/10 bg-black/0 p-2 ${className}`.trim()}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-black">{displayLabel}</span>
        <span
          className={`min-w-7 rounded border px-2 py-0.5 text-center text-xs font-semibold ${
            error
              ? "border-neblirDanger-600 text-neblirDanger-600"
              : "border-black/20 text-black"
          }`}
        >
          {clampedValue}
        </span>
      </div>

      {showTicks && (
        <div className="mb-1 flex items-center justify-between px-0.5 text-[10px] text-black/45">
          {Array.from({ length: visualMax - visualMin + 1 }, (_, i) => {
            const n = visualMin + i;
            const disabled =
              disableOutOfRangeTicks && (n < allowedMin || n > allowedMax);
            return (
              <span key={n} className={disabled ? "text-black/25" : ""}>
                {n}
              </span>
            );
          })}
        </div>
      )}

      <input
        id={id}
        type="range"
        min={visualMin}
        max={visualMax}
        step={step}
        value={clampedValue}
        onChange={(e) => {
          const raw = parseInt(e.target.value, 10);
          const next = Number.isNaN(raw) ? clampedValue : raw;
          const clamped = Math.min(allowedMax, Math.max(allowedMin, next));
          onChange(clamped);
        }}
        className={`w-full touch-pan-y accent-customPrimary ${
          error ? "ring-2 ring-neblirDanger-600/40" : ""
        }`}
      />
    </div>
  );
}
