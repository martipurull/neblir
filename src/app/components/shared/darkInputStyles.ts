/**
 * Shared class strings for text controls on **dark** surfaces (game modals, purple shell).
 * For light app pages, use `inputStyles.ts` instead.
 */
export const darkTextFieldClassName =
  "w-full rounded border-2 border-white/50 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50";

/** Rounded shell for `NumberField` (dark); border lives here so steppers clip inside. */
export const darkNumberFieldShellClass =
  "relative flex w-full min-h-[2.75rem] overflow-hidden rounded border-2 border-white/50 focus-within:border-white focus-within:outline-none focus-within:ring-1 focus-within:ring-white has-[:disabled]:opacity-50";

/** Inner input for `NumberField` (dark); no border/radius on the input itself. */
export const darkNumberFieldInnerClass =
  "min-h-[2.75rem] w-full flex-1 appearance-none border-0 bg-transparent px-3 py-2 pr-9 text-sm text-white outline-none placeholder:text-white/40 [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

/** Select/dropdown on dark surfaces: comfortable min-height and option styling. */
export const darkSelectClassName =
  darkTextFieldClassName +
  " min-h-[48px] cursor-pointer text-base [&>option]:bg-modalBackground-200 [&>option]:text-black";

/** Inline centered qty field flanked by compact ± buttons (dark browse rows). */
export const darkCompactNumberInputClassName =
  "h-7 w-10 shrink-0 appearance-none rounded border border-white/30 bg-transparent px-0 text-center text-xs tabular-nums text-white outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-40 [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
