import React, { forwardRef } from "react";

const base =
  "inline-flex items-center justify-center rounded border-2 bg-transparent px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const tone = {
  danger:
    "border-neblirDanger-200 text-neblirDanger-400 hover:bg-neblirDanger-200/20",
  warning:
    "border-neblirWarning-200 text-neblirWarning-400 hover:bg-neblirWarning-200/20",
  safe: "border-neblirSafe-200 text-neblirSafe-400 hover:bg-neblirSafe-200/20",
} as const;

export type SemanticActionTone = keyof typeof tone;

export type SemanticActionButtonProps =
  React.ComponentPropsWithoutRef<"button"> & {
    tone: SemanticActionTone;
  };

/**
 * Full-width outline actions for modals and forms. Matches the “Remove from inventory”
 * treatment: border-2, transparent fill, semantic hover wash.
 */
export const SemanticActionButton = forwardRef<
  HTMLButtonElement,
  SemanticActionButtonProps
>(function SemanticActionButton(
  { tone: toneKey, className = "", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`${base} ${tone[toneKey]} ${className}`.trim()}
      {...props}
    />
  );
});

export const DangerButton = forwardRef<
  HTMLButtonElement,
  Omit<SemanticActionButtonProps, "tone">
>(function DangerButton(props, ref) {
  return <SemanticActionButton ref={ref} tone="danger" {...props} />;
});

export const WarningButton = forwardRef<
  HTMLButtonElement,
  Omit<SemanticActionButtonProps, "tone">
>(function WarningButton(props, ref) {
  return <SemanticActionButton ref={ref} tone="warning" {...props} />;
});

export const SafeButton = forwardRef<
  HTMLButtonElement,
  Omit<SemanticActionButtonProps, "tone">
>(function SafeButton(props, ref) {
  return <SemanticActionButton ref={ref} tone="safe" {...props} />;
});
