"use client";

import React from "react";

export function KeyValueRow({
  label,
  value,
  className = "py-2.5 first:pt-0",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <li className={`flex items-baseline justify-between gap-4 ${className}`}>
      <span className="flex shrink-0 items-center gap-2 text-xs font-medium uppercase tracking-widest text-black">
        <span className="h-3 w-px bg-black" aria-hidden />
        {label}
      </span>
      <span className="min-w-0 truncate text-right text-sm text-black">
        {value}
      </span>
    </li>
  );
}
