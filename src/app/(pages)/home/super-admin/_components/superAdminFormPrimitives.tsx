"use client";

import { TextArea } from "@/app/components/shared/TextArea";
import { TextField } from "@/app/components/shared/TextField";
import type { ComponentPropsWithoutRef } from "react";
import type { FieldPath, FieldValues, UseFormRegister } from "react-hook-form";

export function SuperAdminLabeledField<T extends FieldValues>({
  id,
  label,
  register,
  name,
  type = "text",
  placeholder,
  rows,
  step,
  min,
  max,
  disabled = false,
}: {
  id: string;
  label: string;
  register: UseFormRegister<T>;
  name: FieldPath<T>;
  type?: string;
  placeholder?: string;
  rows?: number;
  step?: ComponentPropsWithoutRef<"input">["step"];
  min?: ComponentPropsWithoutRef<"input">["min"];
  max?: ComponentPropsWithoutRef<"input">["max"];
  disabled?: boolean;
}) {
  return (
    <div className="mb-6">
      <label htmlFor={id} className="mb-1 block font-bold text-black">
        {label}
      </label>
      {rows ? (
        <TextArea
          {...register(name)}
          id={id}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
        />
      ) : (
        <TextField
          {...register(name)}
          id={id}
          type={type}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
          disabled={disabled}
        />
      )}
    </div>
  );
}
