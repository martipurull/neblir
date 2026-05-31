"use client";

import { bumpNumericFieldValue } from "@/app/components/shared/bumpNumericFieldValue";
import {
  darkNumberFieldInnerClass,
  darkNumberFieldShellClass,
} from "@/app/components/shared/darkInputStyles";
import { NumberFieldStepperRail } from "@/app/components/shared/NumberFieldStepperRail";
import {
  sharedNumberFieldInnerClass,
  sharedNumberFieldShellClass,
} from "@/app/components/shared/inputStyles";
import { forwardRef } from "react";

type NumberFieldVariant = "light" | "dark";

export type NumberFieldProps = Omit<
  React.ComponentPropsWithoutRef<"input">,
  "type" | "value" | "onChange" | "className" | "min" | "max" | "step"
> & {
  value: string | number;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  /** Passed to the native `input` (`step="any"` allows free decimal typing). */
  step?: number | "any";
  /** ± rail increment. Defaults to 1 so steppers bump integers unless overridden. */
  stepperStep?: number;
  variant?: NumberFieldVariant;
  /** Layout/sizing on the bordered shell (width, margin, min-height). */
  className?: string;
  /** Typography/padding on the inner input (text-align, font, px/py overrides). */
  inputClassName?: string;
  /** Accessible name for stepper buttons. Falls back to `aria-label` or `id`. */
  stepperLabel?: string;
};

/** Controlled number input with ± steppers (light pages and dark game modals). */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  function NumberField(
    {
      value,
      onChange,
      variant = "light",
      className = "",
      inputClassName = "",
      disabled = false,
      min,
      max,
      step = 1,
      stepperStep = 1,
      placeholder,
      id,
      stepperLabel,
      "aria-label": ariaLabel,
      onBlur,
      ...rest
    },
    ref
  ) {
    const displayValue = value === "" || value == null ? "" : String(value);
    const shellClass =
      variant === "dark"
        ? darkNumberFieldShellClass
        : sharedNumberFieldShellClass;
    const innerClass =
      variant === "dark"
        ? darkNumberFieldInnerClass
        : sharedNumberFieldInnerClass;
    const shellClassName = [shellClass, className].filter(Boolean).join(" ");
    const mergedInnerClass = [innerClass, inputClassName]
      .filter(Boolean)
      .join(" ");
    const railLabel = stepperLabel ?? ariaLabel ?? id ?? "Number";

    const bump = (direction: 1 | -1) => {
      onChange(
        bumpNumericFieldValue(displayValue, direction, min, max, stepperStep)
      );
    };

    return (
      <div className={shellClassName}>
        <input
          {...rest}
          ref={ref}
          id={id}
          type="number"
          inputMode={
            step === "any" || !Number.isInteger(step) ? "decimal" : "numeric"
          }
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={mergedInnerClass}
          disabled={disabled}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          aria-label={ariaLabel}
        />
        <NumberFieldStepperRail
          label={railLabel}
          disabled={disabled}
          variant={variant === "dark" ? "dark" : "light"}
          onBump={bump}
        />
      </div>
    );
  }
);
