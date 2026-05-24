"use client";

import { TextField } from "@/app/components/shared/TextField";

type SuperAdminCatalogueSearchInputProps = {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
};

export function SuperAdminCatalogueSearchInput({
  id,
  label,
  placeholder = "Search by name…",
  value,
  onChange,
}: SuperAdminCatalogueSearchInputProps) {
  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-semibold text-black"
      >
        {label}
      </label>
      <TextField
        id={id}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </div>
  );
}
