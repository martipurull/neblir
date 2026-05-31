"use client";

type FieldLabelProps = {
  id: string;
  label: string;
  /** If true, show red * and treat as required. If false, show (optional). Dark variant only. */
  required?: boolean;
  /**
   * When false, renders a non-interactive heading (use when the control is opened
   * programmatically, e.g. hidden file inputs).
   */
  associateControl?: boolean;
  variant?: "light" | "dark";
};

export function FieldLabel({
  id,
  label,
  required = false,
  associateControl = true,
  variant = "dark",
}: FieldLabelProps) {
  const isLight = variant === "light";
  const className = isLight
    ? "mb-1 block text-sm font-bold text-black"
    : "mb-1 block text-sm font-medium text-white";

  const content = isLight ? (
    label
  ) : (
    <>
      {label}
      {required ? (
        <span className="ml-1 text-neblirDanger-400" aria-hidden="true">
          *
        </span>
      ) : (
        <span className="ml-1 text-white/50">(optional)</span>
      )}
    </>
  );

  if (associateControl) {
    return (
      <label htmlFor={id} className={className}>
        {content}
      </label>
    );
  }

  return (
    <p id={id} className={className}>
      {content}
    </p>
  );
}
