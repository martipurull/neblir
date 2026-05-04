"use client";
type ModalFieldLabelProps = {
  id: string;
  label: string;
  /** If true, show red * and treat as required. If false, show (optional). */
  required?: boolean;
};

export function ModalFieldLabel({
  id,
  label,
  required = false,
}: ModalFieldLabelProps) {
  return (
    <label htmlFor={id} className="mb-1 block text-sm font-medium text-white">
      {label}
      {required ? (
        <span className="ml-1 text-neblirDanger-400" aria-hidden="true">
          *
        </span>
      ) : (
        <span className="ml-1 text-white/50">(optional)</span>
      )}
    </label>
  );
}
