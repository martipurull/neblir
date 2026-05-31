export type RichTextFieldVariant = "light" | "dark";

export function richTextFieldShellClassName(
  variant: RichTextFieldVariant
): string {
  if (variant === "dark") {
    return "rich-text-content rounded border-2 border-white/50 bg-transparent px-3 py-2 text-white shadow-sm focus-within:ring-2 focus-within:ring-white/30";
  }
  return "rounded-md border border-black/20 bg-paleBlue/40 px-2 py-2 focus-within:ring-2 focus-within:ring-customPrimaryHover";
}

export function richTextProseMirrorClassName(
  variant: RichTextFieldVariant
): string {
  if (variant === "dark") {
    return "outline-none text-sm text-white leading-relaxed focus:outline-none caret-white selection:bg-paleBlue/25 selection:text-black [&_a]:text-white [&_a]:underline";
  }
  return "rich-text-content max-w-none px-2 py-1 text-sm text-black outline-none focus:outline-none [&_a]:text-customPrimary [&_a]:underline";
}

export function richTextToolbarClassName(
  variant: RichTextFieldVariant
): string {
  if (variant === "dark") {
    return "mb-2 flex flex-wrap gap-2 border-b border-white/25 pb-2";
  }
  return "mb-2 flex flex-wrap gap-2 border-b border-black/15 pb-2";
}

export function richTextFieldLoadingClassName(
  variant: RichTextFieldVariant
): string {
  if (variant === "dark") {
    return "text-sm text-white/70";
  }
  return "text-sm text-black/50";
}
