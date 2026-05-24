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
}) {
  return (
    <div className="mb-6">
      <label htmlFor={id} className="mb-1 block font-bold text-black">
        {label}
      </label>
      {rows ? (
        <TextArea
          id={id}
          rows={rows}
          placeholder={placeholder}
          {...register(name)}
        />
      ) : (
        <TextField
          id={id}
          type={type}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
          {...register(name)}
        />
      )}
    </div>
  );
}
