/** Shared input class for game modals (CreateCustomItem, CreateUniqueItem, etc.) */
export const modalInputClass =
  "w-full rounded border-2 border-white/50 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50";

/** Like `modalInputClass` plus right padding for steppers; hides native spinners. */
export const modalNumberInputClass =
  modalInputClass +
  " pr-9 [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

/** Select/dropdown: same as modalInputClass with comfortable min-height and option styling */
export const modalSelectClass =
  modalInputClass +
  " min-h-[48px] cursor-pointer text-base [&>option]:bg-modalBackground-200 [&>option]:text-black";
