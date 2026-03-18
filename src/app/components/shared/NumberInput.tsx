"use client";

import React from "react";
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
  /** Optional wrapper class (controls layout/width). */
  className?: string;
  /** Optional input class (extends base styles). */
  inputClassName?: string;
}

export default function NumberInput({
  name,
  label,
  placeholder,
  min,
  max,
  step,
  parseAs = "int",
  className = "",
  inputClassName = "",
}: NumberInputProps) {
  const { control } = useFormContext();

  return (
    <div className={`mb-6 ${className}`.trim()}>
      <label htmlFor={name} className="block font-bold text-black">
        {label}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <input
            {...field}
            id={name}
            type="number"
            min={min}
            max={max}
            step={step}
            inputMode="numeric"
            placeholder={placeholder}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                field.onChange(raw);
                return;
              }
              const n =
                parseAs === "float" ? parseFloat(raw) : parseInt(raw, 10);
              field.onChange(Number.isNaN(n) ? raw : n);
            }}
            className={`min-h-11 w-full rounded-md border border-black/20 bg-paleBlue px-3 py-2 text-black placeholder:text-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimaryHover ${inputClassName}`.trim()}
          />
        )}
      />
    </div>
  );
}
