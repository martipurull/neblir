/**
 * Shared class strings for text controls on **light** app surfaces (`bg-paleBlue`).
 * For dark game modals, use `darkTextFieldClassName` / `darkNumberFieldInnerClass` in
 * `src/app/components/shared/darkInputStyles.ts` instead.
 *
 * Primitives: `TextField`, `TextArea` (`variant="light"`, default) in
 * `src/app/components/shared/`. For single- or multi-line controls in game
 * modals, use `TextField` / `TextArea` with `variant="dark"`.
 */
export const sharedTextFieldClassName =
  "min-h-11 w-full rounded-md border border-black/20 bg-paleBlue px-3 py-2 text-black placeholder:text-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimaryHover";

/** Rounded shell for `NumberField` (light); border and fill live here so steppers clip inside. */
export const sharedNumberFieldShellClass =
  "relative flex w-full min-h-11 overflow-hidden rounded-md border border-black/20 bg-paleBlue focus-within:outline-none focus-within:ring-2 focus-within:ring-customPrimaryHover has-[:disabled]:opacity-50";

/** Inner input for `NumberField` (light); no border/radius on the input itself. */
export const sharedNumberFieldInnerClass =
  "min-h-11 w-full flex-1 appearance-none border-0 bg-transparent px-3 py-2 pr-9 text-black outline-none placeholder:text-black/40 [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

/** Compact filter (`TextField` `density="compact"`) inside `SelectDropdown` menus. */
export const sharedTextFieldCompactClassName =
  "w-full rounded border border-black/30 bg-paleBlue px-2 py-1.5 text-sm text-black placeholder:text-black/50 focus:border-customPrimaryHover focus:outline-none focus-visible:ring-1 focus-visible:ring-customPrimaryHover";

/** Inline centered qty (`NumberField` `density="compact"`, light surfaces). */
export const sharedCompactNumberInputClassName =
  "h-9 w-14 shrink-0 appearance-none rounded-md border border-black/20 bg-paleBlue px-0 text-center text-sm tabular-nums text-black outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimaryHover disabled:opacity-50 [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

/** ± chevron buttons inside `NumberFieldStepperRail` (light). */
export const numberFieldStepperButtonLightClass =
  "flex flex-1 items-center justify-center rounded-sm text-black/55 transition hover:bg-black/[0.06] hover:text-black focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-2px] focus-visible:outline-customPrimaryHover disabled:pointer-events-none";

/** ± chevron buttons inside `NumberFieldStepperRail` (dark). */
export const numberFieldStepperButtonDarkClass =
  "flex flex-1 items-center justify-center rounded-sm text-white/75 transition hover:bg-paleBlue/15 hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-2px] focus-visible:outline-white/60 disabled:pointer-events-none";
