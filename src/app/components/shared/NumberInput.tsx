"use client";

import {
  coerceNumericFieldValue,
  isIncompleteNumericText,
  shouldKeepDecimalDraft,
} from "@/app/components/shared/bumpNumericFieldValue";
import { NumberField } from "@/app/components/shared/NumberField";
import { useRef, useState, type Ref } from "react";
import { Controller, useFormContext } from "react-hook-form";

export interface NumberInputProps {
  name: string;
  label: string;
  placeholder?: string;
  min?: number;
  max?: number;
  /** Passed to the native `input` (`step="any"` allows free decimal typing). */
  step?: number | "any";
  /** ± rail increment. Defaults to 1. */
  stepperStep?: number;
  /**
   * When true, ± keeps a fractional value (`1.5` → `2.5`).
   * Official vehicle weight, height, and cargo set this. Other fields round.
   */
  preserveStepperFraction?: boolean;
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

/** An explicit `mb-*` in `className` replaces the default `mb-6`. */
function numberInputShellClass(className: string): string {
  const extra = className.trim();
  if (extra.split(/\s+/).some((token) => token.includes("mb-"))) {
    return extra;
  }
  return extra ? `mb-6 ${extra}` : "mb-6";
}

function NumberInputControl({
  name,
  value,
  inputRef,
  onValueChange,
  onFieldBlur,
  placeholder,
  min,
  max,
  step,
  stepperStep,
  preserveStepperFraction,
  parseAs,
  disabled,
  inputClassName,
  allowEmpty,
  label,
}: {
  name: string;
  value: unknown;
  inputRef: Ref<HTMLInputElement>;
  onValueChange: (value: number | undefined) => void;
  onFieldBlur: () => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step: number | "any";
  stepperStep: number;
  preserveStepperFraction: boolean;
  parseAs: "int" | "float";
  disabled: boolean;
  inputClassName: string;
  allowEmpty: boolean;
  label: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const skipCommitOnBlur = useRef(false);
  const committed = fieldValueToString(value);
  const allowDecimalDraft = step === "any";

  const commit = (raw: string, keepDraft: boolean) => {
    if (allowEmpty && raw.trim() === "") {
      setDraft(null);
      onValueChange(undefined);
      return;
    }
    if (keepDraft && allowDecimalDraft && isIncompleteNumericText(raw)) {
      setDraft(raw);
      return;
    }
    const next = coerceNumericFieldValue(raw, parseAs, min, max);
    if (keepDraft && allowDecimalDraft && shouldKeepDecimalDraft(raw, next)) {
      setDraft(raw);
    } else {
      setDraft(null);
    }
    onValueChange(next);
  };

  return (
    <NumberField
      ref={inputRef}
      id={name}
      name={name}
      value={draft ?? committed}
      onChange={(raw) => commit(raw, true)}
      onWheel={() => {
        skipCommitOnBlur.current = true;
      }}
      onBlur={(e) => {
        onFieldBlur();
        if (skipCommitOnBlur.current) {
          skipCommitOnBlur.current = false;
          setDraft(null);
          return;
        }
        commit(e.target.value, false);
      }}
      disabled={disabled}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      stepperStep={stepperStep}
      preserveStepperFraction={preserveStepperFraction}
      variant="light"
      stepperLabel={label}
      inputClassName={inputClassName}
    />
  );
}

export function NumberInput({
  name,
  label,
  placeholder,
  min,
  max,
  step = 1,
  stepperStep = 1,
  preserveStepperFraction = false,
  parseAs = "int",
  disabled = false,
  className = "",
  inputClassName = "",
  allowEmpty = false,
}: NumberInputProps) {
  const { control } = useFormContext();

  return (
    <div className={numberInputShellClass(className)}>
      <label htmlFor={name} className="mb-1 block font-bold text-black">
        {label}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <NumberInputControl
            name={field.name}
            value={field.value}
            inputRef={field.ref}
            onValueChange={field.onChange}
            onFieldBlur={field.onBlur}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            stepperStep={stepperStep}
            preserveStepperFraction={preserveStepperFraction}
            parseAs={parseAs}
            disabled={disabled}
            inputClassName={inputClassName}
            allowEmpty={allowEmpty}
            label={label}
          />
        )}
      />
    </div>
  );
}
