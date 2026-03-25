import React from "react";

type DetailFieldProps = {
  label: string;
  className?: string;
  children: React.ReactNode;
};

/** Label + value cell for the item detail summary grid. */
export function DetailField({ label, className, children }: DetailFieldProps) {
  return (
    <div className={className}>
      <span className="text-white/60 uppercase tracking-wider">{label}</span>
      <div className="mt-0.5 text-white">{children}</div>
    </div>
  );
}
