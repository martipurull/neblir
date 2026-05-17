"use client";

import {
  bumpNumericFieldValue,
  coerceNumericFieldValue,
} from "@/app/components/shared/bumpNumericFieldValue";
import { NumberFieldStepperRail } from "@/app/components/shared/NumberFieldStepperRail";
import { sharedNumberInputClassName } from "@/app/components/shared/inputStyles";
import { Controller, useFormContext } from "react-hook-form";

export interface NumberInputProps {
  name: string;
  label: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  /** Defaults to "int". */
  parseAs?: "int" | "float";
  disabled?: boolean;
  /** Optional wrapper class (controls layout/width). */
  className?: string;
  /** Optional input class (extends base styles). */
  inputClassName?: string;
}

function fieldValueToString(value: unknown): string {
  if (value === "" || value == null) {
    return "";
  }
  return String(value);
}

export default function NumberInput({
  name,
  label,
  placeholder,
  min,
  max,
  step = 1,
  parseAs = "int",
  disabled = false,
  className = "",
  inputClassName = "",
}: NumberInputProps) {
  const { control } = useFormContext();

  const inputClass = [sharedNumberInputClassName, inputClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`mb-6 ${className}`.trim()}>
      <label htmlFor={name} className="mb-1 block font-bold text-black">
        {label}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const displayValue = fieldValueToString(field.value);

          const setFromRaw = (raw: string) => {
            field.onChange(coerceNumericFieldValue(raw, parseAs, min, max));
          };

          const bump = (direction: 1 | -1) => {
            setFromRaw(
              bumpNumericFieldValue(displayValue, direction, min, max, step)
            );
          };

          return (
            <div className="relative">
              <input
                ref={field.ref}
                name={field.name}
                id={name}
                type="number"
                inputMode={Number.isInteger(step) ? "numeric" : "decimal"}
                value={displayValue}
                onChange={(e) => setFromRaw(e.target.value)}
                onBlur={(e) => {
                  field.onBlur();
                  setFromRaw(e.target.value);
                }}
                className={inputClass}
                disabled={disabled}
                placeholder={placeholder}
                min={min}
                max={max}
                step={step}
              />
              <NumberFieldStepperRail
                label={label}
                disabled={disabled}
                variant="light"
                onBump={bump}
              />
            </div>
          );
        }}
      />
    </div>
  );
}
