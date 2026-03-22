import React from "react";

/** Shared class for section headings (also use on `<span>` inside collapsible headers). */
export const gmSectionTitleClassName =
  "text-base font-semibold text-black mb-6";

export function GmSectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className={gmSectionTitleClassName}>{children}</h2>;
}
