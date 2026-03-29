"use client";

import React from "react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  disabled?: boolean;
  tone?: "default" | "inverse";
  className?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  tone = "default",
  className = "",
}: CheckboxProps) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-2 text-sm ${
        tone === "inverse" ? "text-white" : "text-black"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={`h-4 w-4 shrink-0 rounded border focus:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${
          tone === "inverse"
            ? "border-white/50 bg-paleBlue accent-customPrimary focus-visible:ring-white/40"
            : "border-black/40 bg-paleBlue accent-customPrimary focus-visible:ring-customPrimaryHover"
        }`}
      />
      {label}
    </label>
  );
}
