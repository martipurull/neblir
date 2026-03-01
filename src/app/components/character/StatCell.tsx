"use client";

import React from "react";

export interface StatCellProps {
  label: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  compact?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  /** Override border color (e.g. border-neblirSafe-200) */
  borderClassName?: string;
  /** Override value text color (e.g. text-neblirSafe-400) */
  valueClassName?: string;
  /** Override subValue text color (default: text-neblirWarning-600) */
  subValueClassName?: string;
}

export function StatCell({
  label,
  value,
  subValue,
  compact = false,
  onClick,
  disabled = false,
  borderClassName,
  valueClassName,
  subValueClassName,
}: StatCellProps) {
  const borderClass = borderClassName ?? "border-black";
  const valueClass =
    (compact
      ? "mt-0.5 min-w-0 truncate text-center text-xs font-bold"
      : "mt-1 min-w-0 truncate text-center text-sm font-bold") +
    " " +
    (valueClassName ?? "text-black");

  const cellContent = (
    <>
      <span
        className={
          compact
            ? "text-[10px] text-center font-medium uppercase tracking-wider text-black leading-tight"
            : "text-xs text-center font-medium uppercase tracking-wider text-black leading-tight"
        }
      >
        {label}
      </span>
      <span className={valueClass}>{value}</span>
      {subValue != null && (
        <span
          className={
            (compact
              ? "mt-0.5 min-w-0 truncate text-center text-[10px] leading-tight"
              : "mt-0.5 min-w-0 truncate text-center text-xs leading-tight") +
            " " +
            (subValueClassName ?? "text-neblirWarning-600")
          }
        >
          {subValue}
        </span>
      )}
    </>
  );

  const baseCompact =
    "flex h-14 min-w-0 flex-col items-center justify-center rounded-lg border bg-transparent p-1.5";
  const baseDefault =
    "flex aspect-square min-w-0 flex-col items-center justify-center rounded-lg border bg-transparent p-2";
  const disabledClass = disabled ? "cursor-not-allowed opacity-50" : "";
  const clickableClass =
    onClick && !disabled
      ? "cursor-pointer transition hover:bg-black/10 active:bg-black/15"
      : "";

  if (compact) {
    const className = `${baseCompact} ${borderClass} ${disabledClass} ${clickableClass}`;
    if (onClick != null) {
      return (
        <button
          type="button"
          onClick={disabled ? undefined : onClick}
          disabled={disabled}
          className={className}
        >
          {cellContent}
        </button>
      );
    }
    return <div className={className}>{cellContent}</div>;
  }

  const className = `${baseDefault} ${borderClass} ${disabledClass} ${clickableClass}`;
  if (onClick != null) {
    return (
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={className}
      >
        {cellContent}
      </button>
    );
  }
  return <div className={className}>{cellContent}</div>;
}
