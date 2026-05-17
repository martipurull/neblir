"use client";

import { bumpNumericFieldValue } from "@/app/components/shared/bumpNumericFieldValue";
import { NumberFieldStepperRail } from "@/app/components/shared/NumberFieldStepperRail";
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
    onChange(bumpNumericFieldValue(value, direction, min, max, step));
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
        <NumberFieldStepperRail
          label={label}
          disabled={disabled}
          variant="dark"
          onBump={bump}
        />
      </div>
    </div>
  );
}
