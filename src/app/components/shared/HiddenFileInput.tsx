import { forwardRef } from "react";

/**
 * Native file inputs must not use in-flow `sr-only` positioning: focusing them
 * (via label htmlFor) scrolls the page and can inflate scroll height.
 * This is the only module that renders `<input type="file">`.
 */
const hiddenFileInputClassName =
  "pointer-events-none fixed left-0 top-0 h-px w-px overflow-hidden opacity-0";

export type HiddenFileInputProps = {
  id: string;
  accept: string;
  disabled?: boolean;
  onFile: (file: File | null) => void;
};

export const HiddenFileInput = forwardRef<
  HTMLInputElement,
  HiddenFileInputProps
>(function HiddenFileInput({ id, accept, disabled = false, onFile }, ref) {
  return (
    <input
      ref={ref}
      id={id}
      type="file"
      accept={accept}
      tabIndex={-1}
      aria-hidden
      className={hiddenFileInputClassName}
      disabled={disabled}
      onChange={(event) => {
        const file = event.target.files?.[0] ?? null;
        onFile(file);
        event.target.value = "";
      }}
    />
  );
});
