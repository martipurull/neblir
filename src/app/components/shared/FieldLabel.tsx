"use client";

type FieldLabelProps = {
  id: string;
  label: string;
  /**
   * Dark variant only, and only when `showRequirement` is true. A red * when
   * required, otherwise "(optional)".
   */
  required?: boolean;
  /**
   * Dark variant only. When false, the label is the text alone: no red * and
   * no "(optional)".
   */
  showRequirement?: boolean;
  /**
   * When false, renders a non-interactive heading (use when the control is opened
   * programmatically, e.g. hidden file inputs).
   */
  associateControl?: boolean;
  variant?: "light" | "dark";
};

export function RequiredMark() {
  return (
    <span className="ml-1 text-neblirDanger-400" aria-hidden="true">
      *
    </span>
  );
}

export function FieldLabel({
  id,
  label,
  required = false,
  showRequirement = true,
  associateControl = true,
  variant = "dark",
}: FieldLabelProps) {
  const isLight = variant === "light";
  const className = isLight
    ? "mb-1 block text-sm font-bold text-black"
    : "mb-1 block text-sm font-medium text-white";

  const content =
    isLight || !showRequirement ? (
      label
    ) : (
      <>
        {label}
        {required ? (
          <RequiredMark />
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
