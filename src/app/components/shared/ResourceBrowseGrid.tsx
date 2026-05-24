import type { ReactNode } from "react";

type ResourceBrowseGridProps = {
  children: ReactNode;
  className?: string;
};

/** Equal-height two-column grid for catalogue / resource browse pages. */
export function ResourceBrowseGrid({
  children,
  className = "",
}: ResourceBrowseGridProps) {
  return (
    <ul className={`grid gap-4 sm:grid-cols-2 ${className}`.trim()}>
      {children}
    </ul>
  );
}

export function ResourceBrowseGridItem({ children }: { children: ReactNode }) {
  return <li className="flex">{children}</li>;
}
