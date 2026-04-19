"use client";

import React from "react";

type RadioOption = {
  value: string;
  label: string;
};

interface RadioGroupProps {
  name: string;
  label?: string;
  value: string;
  options: RadioOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  tone?: "default" | "inverse";
  variant?: "boxed" | "chip";
}

export function RadioGroup({
  name,
  label,
  value,
  options,
  onChange,
  disabled = false,
  tone = "default",
  variant = "boxed",
}: RadioGroupProps) {
  const selectedClass =
    tone === "inverse"
      ? "border-white bg-paleBlue/20 text-white"
      : "border-customPrimary bg-customPrimary text-black";
  const unselectedClass =
    tone === "inverse"
      ? "border-white/30 bg-transparent text-white hover:border-white/50"
      : "border-customPrimary bg-transparent text-black hover:border-black/50";
  const baseShape =
    variant === "chip"
      ? "rounded px-3 py-1.5"
      : "rounded-md min-h-11 px-3 py-2";

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      {label ? (
        <legend
          className={`mb-1 block text-sm font-bold lg:text-center ${
            tone === "inverse" ? "text-white" : "text-black"
          }`}
        >
          {label}
        </legend>
      ) : null}
      <div className="flex flex-wrap gap-3 lg:justify-center">
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={`inline-flex items-center gap-2 border-2 text-sm font-medium transition-colors ${
                checked ? selectedClass : unselectedClass
              } ${baseShape} ${
                variant === "chip" ? "" : ""
              } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(option.value)}
                className={`${variant === "chip" ? "sr-only" : "h-4 w-4"} ${
                  tone === "inverse" ? "accent-white" : "accent-customPrimary"
                }`}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
