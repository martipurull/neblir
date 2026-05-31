"use client";

import { NumberField } from "@/app/components/shared/NumberField";
import { FieldLabel } from "@/app/components/shared/FieldLabel";

export type ModalNumberFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  /** Passed to FieldLabel. Defaults to true (required marker). */
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  /** Appended to the number input class string. */
  inputClassName?: string;
};

/** Controlled number input for game modals (dark theme, FieldLabel). */
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
  return (
    <div>
      <FieldLabel id={id} label={label} required={required} />
      <NumberField
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        variant="dark"
        stepperLabel={label}
        inputClassName={inputClassName}
      />
    </div>
  );
}
