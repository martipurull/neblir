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

/** Matches thumb size below (w-4 / h-4). Thumb center spans [R, W−R] of the track width. */
const THUMB_PX = 16;
const THUMB_R_PX = 8;

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
  const visualSpan = visualMax - visualMin;
  const t = visualSpan <= 0 ? 0 : (clampedValue - visualMin) / visualSpan;
  const thumbEdgeStop = `calc(${THUMB_R_PX}px + (100% - ${THUMB_PX}px) * ${t})`;

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

      <div className="px-2">
        {showTicks && (
          <div className="relative mb-1 h-4 text-[10px] text-black/45">
            {Array.from({ length: visualMax - visualMin + 1 }, (_, i) => {
              const n = visualMin + i;
              const disabled =
                disableOutOfRangeTicks && (n < allowedMin || n > allowedMax);
              const tickT = visualSpan <= 0 ? 0 : (n - visualMin) / visualSpan;
              const tickLeft = `calc(${THUMB_R_PX}px + (100% - ${THUMB_PX}px) * ${tickT})`;
              return (
                <span
                  key={n}
                  className={`absolute top-0 -translate-x-1/2 ${
                    disabled ? "text-black/25" : ""
                  }`}
                  style={{ left: tickLeft }}
                >
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
          style={
            {
              "--thumb-edge-stop": thumbEdgeStop,
            } as React.CSSProperties
          }
          onChange={(e) => {
            const raw = parseInt(e.target.value, 10);
            const next = Number.isNaN(raw) ? clampedValue : raw;
            const clamped = Math.min(allowedMax, Math.max(allowedMin, next));
            onChange(clamped);
          }}
          className={`m-0 w-full max-w-full appearance-none border-0 bg-transparent p-0 touch-pan-y accent-customPrimary box-border ${
            error ? "ring-2 ring-neblirDanger-600/40" : ""
          } [&::-moz-focus-outer]:border-0 [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,#421161_0px,#421161_var(--thumb-edge-stop),#dbeafe_var(--thumb-edge-stop),#dbeafe_100%)] [&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-customPrimary [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(0,0,0,0.2)] [&::-moz-range-progress]:h-2 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-customPrimary [&::-moz-range-track]:h-2 [&::-moz-range-track]:w-full [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-paleBlue [&::-moz-range-thumb]:box-border [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-customPrimary [&::-moz-range-thumb]:shadow-[0_0_0_2px_rgba(0,0,0,0.2)]`}
        />
      </div>
    </div>
  );
}
