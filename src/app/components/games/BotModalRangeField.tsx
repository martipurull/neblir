"use client";

import { RangeSlider } from "@/app/components/shared/RangeSlider";

function sliderNumber(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function BotModalRangeField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  disabled,
  allowBlank,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  disabled: boolean;
  /** Blank stays blank until the person moves the slider, and Clear returns to blank. */
  allowBlank: boolean;
}) {
  const numeric = sliderNumber(value);
  const blank = allowBlank && numeric == null;
  return (
    <RangeSlider
      id={id}
      surface="modal"
      label={label}
      value={numeric ?? min}
      blank={blank}
      allowBlank={allowBlank}
      allowedMin={min}
      allowedMax={max}
      disabled={disabled}
      requirement={allowBlank ? "optional" : "required"}
      onChange={(next) => onChange(String(next))}
      onClear={() => onChange("")}
    />
  );
}
