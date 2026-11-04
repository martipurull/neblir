import { characterStatusMark } from "@/app/lib/characterStatusMark";
import type { Status } from "@prisma/client";

type PortraitCrossProps = {
  status?: Status | null;
};

/** Glance mark over a character portrait. The status mark decides whether it shows and its colour. */
export function PortraitCross({ status }: PortraitCrossProps) {
  if (status == null) return null;
  const mark = characterStatusMark(status);
  if (!mark.showCross || mark.textClassName == null) return null;
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-3xl font-bold leading-none ${mark.textClassName}`}
    >
      ×
    </span>
  );
}
