import type { ReactNode } from "react";

const SPACING_CLASS = {
  tight: "gap-1.5",
  default: "gap-2",
  relaxed: "gap-3",
} as const;

interface CheckboxRowProps {
  children: ReactNode;
  spacing?: keyof typeof SPACING_CLASS;
  className?: string;
}

/** Wrapping row of `Checkbox` controls with consistent spacing between options. */
export function CheckboxRow({
  children,
  spacing = "default",
  className = "",
}: CheckboxRowProps) {
  return (
    <div className={`flex flex-wrap ${SPACING_CLASS[spacing]} ${className}`}>
      {children}
    </div>
  );
}
