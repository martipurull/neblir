"use client";

import { Button } from "@/app/components/shared/Button";
import { RequiredMark } from "@/app/components/shared/FieldLabel";
import type { CSSProperties } from "react";

type RangeSliderSurface = "page" | "modal";

export type RangeSliderProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  /**
   * `page` is the pale field and the default. `modal` is the slider on a modal
   * shell. Both follow the document Theme. Callers pass a surface, not a Theme.
   */
  surface?: RangeSliderSurface;
  /** Allowed range (enforced via clamping). */
  allowedMin?: number;
  allowedMax?: number;
  /** Visual range for the slider track. Defaults to the allowed range. */
  visualMin?: number;
  visualMax?: number;
  /** Step for the slider. Defaults to 1. */
  step?: number;
  /** Optional helper label shown next to the main label (e.g. "(race +1)") */
  labelSuffix?: string;
  /** When true, show a tick label for each integer in the visual range. */
  showTicks?: boolean;
  /** Values outside allowed range are greyed out in ticks. */
  disableOutOfRangeTicks?: boolean;
  /** Show red styling (e.g. over-allocation). */
  error?: boolean;
  /** When false, omit the inline label (use an external label instead). */
  showLabel?: boolean;
  disabled?: boolean;
  /**
   * Modal surface only. `required` draws the red asterisk. `optional` draws
   * “(optional)”. Omit it to leave the label as text.
   */
  requirement?: "required" | "optional";
  /**
   * When true, `blank` keeps the control unset. Moving the slider sets a
   * number. Clear returns it to blank through `onClear`.
   */
  allowBlank?: boolean;
  blank?: boolean;
  onClear?: () => void;
  /** Optional wrapper class for layout. */
  className?: string;
};

/** Matches thumb size below (w-4 / h-4). Thumb center spans [R, W−R] of the track width. */
const THUMB_PX = 16;
const THUMB_R_PX = 8;

const RANGE_INPUT_CLASS =
  "m-0 box-border w-full max-w-full appearance-none touch-pan-y border-0 bg-transparent p-0 [&::-moz-focus-outer]:border-0 [&::-moz-range-progress]:h-2 [&::-moz-range-progress]:rounded-full [&::-moz-range-thumb]:box-border [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-track]:h-2 [&::-moz-range-track]:w-full [&::-moz-range-track]:rounded-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full";

const RANGE_TRACK_CLASS =
  "[&::-moz-range-track]:bg-[var(--slider-rest)] [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--slider-fill)_0px,var(--slider-fill)_var(--thumb-edge-stop),var(--slider-rest)_var(--thumb-edge-stop),var(--slider-rest)_100%)]";

const PAGE_RANGE_CLASS =
  "accent-customPrimary [&::-moz-range-progress]:bg-customPrimary [&::-moz-range-thumb]:bg-customPrimary [&::-moz-range-thumb]:shadow-[0_0_0_2px_rgba(0,0,0,0.2)] [&::-webkit-slider-thumb]:bg-customPrimary [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(0,0,0,0.2)]";

const MODAL_RANGE_CLASS =
  "accent-white [&::-moz-range-progress]:bg-white [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_0_0_2px_rgb(var(--theme-accent-rgb))] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgb(var(--theme-accent-rgb))]";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function RangeSlider({
  id,
  label,
  value,
  onChange,
  surface = "page",
  allowedMin = 1,
  allowedMax = 5,
  visualMin = allowedMin,
  visualMax = allowedMax,
  step = 1,
  labelSuffix,
  showTicks = true,
  disableOutOfRangeTicks = true,
  error = false,
  showLabel = true,
  disabled = false,
  requirement,
  allowBlank = false,
  blank = false,
  onClear,
  className = "",
}: RangeSliderProps) {
  const modal = surface === "modal";
  const isBlank = allowBlank && blank;
  const clampedValue = clamp(value, allowedMin, allowedMax);
  const displayLabel = labelSuffix ? `${label} ${labelSuffix}` : label;
  const visualSpan = visualMax - visualMin;
  const t = visualSpan <= 0 ? 0 : (clampedValue - visualMin) / visualSpan;
  const thumbEdgeStop = isBlank
    ? "0px"
    : `calc(${THUMB_R_PX}px + (100% - ${THUMB_PX}px) * ${t})`;

  const valueBadgeClassName = error
    ? "min-w-9 rounded border-2 border-neblirDanger-600 px-3 py-1 text-center text-base font-bold text-neblirDanger-600"
    : modal
      ? "min-w-9 rounded border border-white/40 px-2 py-0.5 text-center text-xs font-semibold text-white"
      : showLabel
        ? "min-w-7 rounded border border-black/20 px-2 py-0.5 text-center text-xs font-semibold text-black"
        : "min-w-9 rounded border-2 border-customPrimary/40 px-3 py-1 text-center text-base font-bold text-customPrimary";

  const shellClassName = modal
    ? "rounded-md border border-white/20 bg-transparent p-2"
    : "rounded-md border border-black/10 bg-black/0 p-2";
  const labelClassName = modal
    ? "text-sm font-medium text-white"
    : "text-sm font-medium text-black";
  const tickClassName = modal ? "text-white/55" : "text-black/45";
  const disabledTickClassName = modal ? "text-white/25" : "text-black/25";

  const commit = (raw: string) => {
    const parsed = parseInt(raw, 10);
    const next = Number.isNaN(parsed) ? clampedValue : parsed;
    onChange(clamp(next, allowedMin, allowedMax));
  };

  const sliderStyle = {
    "--thumb-edge-stop": thumbEdgeStop,
    "--slider-fill": modal
      ? "rgb(var(--theme-white-rgb))"
      : "rgb(var(--theme-accent-rgb))",
    "--slider-rest": modal
      ? "rgb(var(--theme-white-rgb) / 0.28)"
      : "rgb(var(--theme-card-rgb))",
  } as CSSProperties;

  return (
    <div className={`${shellClassName} ${className}`.trim()}>
      <div
        className={`mb-1 flex flex-wrap items-center gap-2 ${
          showLabel ? "justify-between" : "justify-end"
        }`}
      >
        {showLabel ? (
          <label htmlFor={id} className={labelClassName}>
            {displayLabel}
            {modal && requirement === "required" ? <RequiredMark /> : null}
            {modal && requirement === "optional" ? (
              <span className="ml-1 font-normal text-white/50">(optional)</span>
            ) : null}
          </label>
        ) : null}
        <span className="flex items-center gap-2">
          {modal && allowBlank && !isBlank ? (
            <Button
              type="button"
              variant="modalInlineLink"
              fullWidth={false}
              disabled={disabled}
              aria-label={`Clear ${displayLabel}`}
              onClick={onClear}
            >
              Clear
            </Button>
          ) : null}
          <span className={valueBadgeClassName}>
            {isBlank ? "Blank" : clampedValue}
          </span>
        </span>
      </div>

      <div className="px-2">
        {showTicks && (
          <div className={`relative mb-1 h-4 text-[10px] ${tickClassName}`}>
            {Array.from({ length: visualMax - visualMin + 1 }, (_, i) => {
              const n = visualMin + i;
              const tickDisabled =
                disableOutOfRangeTicks && (n < allowedMin || n > allowedMax);
              const tickT = visualSpan <= 0 ? 0 : (n - visualMin) / visualSpan;
              const tickLeft = `calc(${THUMB_R_PX}px + (100% - ${THUMB_PX}px) * ${tickT})`;
              return (
                <span
                  key={n}
                  className={`absolute top-0 -translate-x-1/2 ${
                    tickDisabled ? disabledTickClassName : ""
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
          disabled={disabled}
          aria-valuetext={isBlank ? "Blank" : undefined}
          style={sliderStyle}
          onChange={(event) => {
            commit(event.target.value);
          }}
          onPointerUp={(event) => {
            if (!isBlank || disabled) return;
            commit(event.currentTarget.value);
          }}
          className={`${RANGE_INPUT_CLASS} ${RANGE_TRACK_CLASS} ${
            modal ? MODAL_RANGE_CLASS : PAGE_RANGE_CLASS
          } ${
            isBlank
              ? "[&::-moz-range-thumb]:opacity-0 [&::-webkit-slider-thumb]:opacity-0"
              : ""
          } ${error ? "ring-2 ring-neblirDanger-600/40" : ""} ${
            disabled ? "cursor-not-allowed opacity-60" : ""
          }`}
        />
      </div>
    </div>
  );
}
