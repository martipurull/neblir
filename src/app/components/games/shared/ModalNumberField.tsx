"use client";

import { NumberField } from "@/app/components/shared/NumberField";
import { ModalFieldLabel } from "./ModalFieldLabel";

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
  return (
    <div>
      <ModalFieldLabel id={id} label={label} required={required} />
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
