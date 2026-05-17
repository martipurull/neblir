/**
 * Shared class strings for text controls on **light** app surfaces (`bg-paleBlue`).
 * For dark game modals, use `modalInputClass` / `modalNumberInputClass` in
 * `src/app/components/games/shared/modalStyles.ts` instead.
 *
 * Primitives: `TextField`, `TextArea` (`src/app/components/shared/`).
 */
export const sharedTextFieldClassName =
  "min-h-11 w-full rounded-md border border-black/20 bg-paleBlue px-3 py-2 text-black placeholder:text-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimaryHover";

/** Like `sharedTextFieldClassName` with right padding for ± steppers; hides native spinners. */
export const sharedNumberInputClassName = `${sharedTextFieldClassName} pr-9 [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;

/** Inline filter / compact row (e.g. inside `SelectDropdown` menu). */
export const sharedTextFieldCompactClassName =
  "w-full rounded border border-black/30 bg-paleBlue px-2 py-1.5 text-sm text-black placeholder:text-black/50 focus:border-customPrimaryHover focus:outline-none focus-visible:ring-1 focus-visible:ring-customPrimaryHover";
