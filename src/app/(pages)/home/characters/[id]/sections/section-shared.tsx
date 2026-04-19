"use client";

import React from "react";

export function KeyValueRow({
  label,
  value,
  className = "py-2.5 first:pt-0",
  multilineValue = false,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  /** When true, value aligns to the top and is not truncated (e.g. stacked badges). */
  multilineValue?: boolean;
}) {
  return (
    <li
      className={`flex justify-between gap-4 ${multilineValue ? "items-start" : "items-baseline"} ${className}`}
    >
      <span className="flex shrink-0 items-center gap-2 text-xs font-medium uppercase tracking-widest text-black">
        <span className="h-3 w-px bg-black" aria-hidden />
        {label}
      </span>
      <span
        className={`min-w-0 text-right text-sm text-black ${multilineValue ? "" : "truncate"}`}
      >
        {value}
      </span>
    </li>
  );
}
