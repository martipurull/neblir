/** Shared input class for game modals (CreateCustomItem, CreateUniqueItem, etc.) */
export const modalInputClass =
  "w-full rounded border-2 border-white/50 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50";

/** Rounded shell for `NumberField` (dark); border lives here so steppers clip inside. */
export const modalNumberFieldShellClass =
  "relative w-full overflow-hidden rounded border-2 border-white/50 focus-within:border-white focus-within:outline-none focus-within:ring-1 focus-within:ring-white has-[:disabled]:opacity-50";

/** Inner input for `NumberField` (dark); no border/radius on the input itself. */
export const modalNumberFieldInnerClass =
  "h-full min-h-0 w-full appearance-none border-0 bg-transparent px-3 py-2 pr-9 text-sm text-white outline-none placeholder:text-white/40 [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

/** @deprecated Prefer `modalNumberFieldShellClass` + `modalNumberFieldInnerClass` via `NumberField`. */
export const modalNumberInputClass =
  modalNumberFieldShellClass + " " + modalNumberFieldInnerClass;

/** Select/dropdown: same as modalInputClass with comfortable min-height and option styling */
export const modalSelectClass =
  modalInputClass +
  " min-h-[48px] cursor-pointer text-base [&>option]:bg-modalBackground-200 [&>option]:text-black";
