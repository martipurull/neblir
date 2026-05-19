"use client";

import { coerceNumericFieldValue } from "@/app/components/shared/bumpNumericFieldValue";
import { NumberField } from "@/app/components/shared/NumberField";
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
  /** When true, blank input stores `undefined` instead of coercing to min/0. */
  allowEmpty?: boolean;
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
  allowEmpty = false,
}: NumberInputProps) {
  const { control } = useFormContext();

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
            if (allowEmpty && raw.trim() === "") {
              field.onChange(undefined);
              return;
            }
            field.onChange(coerceNumericFieldValue(raw, parseAs, min, max));
          };

          return (
            <NumberField
              ref={field.ref}
              id={name}
              name={field.name}
              value={displayValue}
              onChange={setFromRaw}
              onBlur={(e) => {
                field.onBlur();
                setFromRaw(e.target.value);
              }}
              disabled={disabled}
              placeholder={placeholder}
              min={min}
              max={max}
              step={step}
              variant="light"
              stepperLabel={label}
              inputClassName={inputClassName}
            />
          );
        }}
      />
    </div>
  );
}
