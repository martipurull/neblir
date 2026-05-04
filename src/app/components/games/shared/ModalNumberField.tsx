"use client";

import { ModalFieldLabel } from "./ModalFieldLabel";
import { modalNumberInputClass } from "./modalStyles";

export type ModalNumberFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  /** Passed to ModalFieldLabel. Defaults to true (required marker). */
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  /** Appended to the number input class string. */
  inputClassName?: string;
};

function bumpValue(
  raw: string,
  direction: 1 | -1,
  min?: number,
  max?: number,
  step = 1
): string {
  const trimmed = raw.trim();
  let n = trimmed === "" ? 0 : Number(trimmed);
  if (Number.isNaN(n)) {
    n = 0;
  }
  let next = n + direction * step;
  if (min != null) {
    next = Math.max(min, next);
  }
  if (max != null) {
    next = Math.min(max, next);
  }
  if (!Number.isInteger(step)) {
    const decPart = step.toString().split(".")[1];
    const decimals = decPart ? decPart.length : 1;
    return Number(next.toFixed(decimals)).toString();
  }
  return String(Math.round(next));
}

function ChevronIcon({ up }: { up: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 12 12"
      width={11}
      height={11}
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <path
        d={up ? "M3 7.5 6 4.5 9 7.5" : "M3 4.5 6 7.5 9 4.5"}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Controlled number input for game modals (dark theme, ModalFieldLabel). */
export function ModalNumberField({
  id,
  label,
  value,
  onChange,
  disabled,
  required = true,
  placeholder,
  min,
  max,
  step = 1,
  inputClassName = "",
}: ModalNumberFieldProps) {
  const inputClass = [modalNumberInputClass, inputClassName]
    .filter(Boolean)
    .join(" ");

  const bump = (direction: 1 | -1) => {
    onChange(bumpValue(value, direction, min, max, step));
  };

  return (
    <div>
      <ModalFieldLabel id={id} label={label} required={required} />
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode={Number.isInteger(step) ? "numeric" : "decimal"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          disabled={disabled}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
        />
        <div
          className={
            "absolute inset-y-px right-px z-[1] flex w-8 flex-col overflow-hidden rounded-r border-l border-white/25 bg-black/25 p-0.5 " +
            (disabled ? "opacity-40" : "")
          }
        >
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label={`Increase ${label}`}
            className="flex flex-1 items-center justify-center rounded-sm text-white/75 transition hover:bg-paleBlue/15 hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-2px] focus-visible:outline-white/60 disabled:pointer-events-none"
            onClick={() => bump(1)}
          >
            <ChevronIcon up />
          </button>
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label={`Decrease ${label}`}
            className="flex flex-1 items-center justify-center rounded-sm text-white/75 transition hover:bg-paleBlue/15 hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-2px] focus-visible:outline-white/60 disabled:pointer-events-none"
            onClick={() => bump(-1)}
          >
            <ChevronIcon up={false} />
          </button>
        </div>
      </div>
    </div>
  );
}
