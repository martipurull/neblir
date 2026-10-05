"use client";

import {
  coerceNumericFieldValue,
  isIncompleteNumericText,
  shouldKeepDecimalDraft,
} from "@/app/components/shared/bumpNumericFieldValue";
import { NumberField } from "@/app/components/shared/NumberField";
import { useState, type Ref } from "react";
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
  parseAs: "int" | "float";
  disabled: boolean;
  inputClassName: string;
  allowEmpty: boolean;
  label: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const committed = fieldValueToString(value);

  const commit = (raw: string, keepDraft: boolean) => {
    if (allowEmpty && raw.trim() === "") {
      setDraft(null);
      onValueChange(undefined);
      return;
    }
    if (keepDraft && isIncompleteNumericText(raw)) {
      setDraft(raw);
      return;
    }
    const next = coerceNumericFieldValue(raw, parseAs, min, max);
    if (keepDraft && shouldKeepDecimalDraft(raw, next)) {
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
      onBlur={(e) => {
        onFieldBlur();
        commit(e.target.value, false);
      }}
      disabled={disabled}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      stepperStep={stepperStep}
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
