import { characterStatusMark } from "@/app/lib/characterStatusMark";
import type { Status } from "@prisma/client";

const statusBadgeBase =
  "inline-flex shrink-0 items-center rounded-full border px-2 py-px text-[10px] font-semibold uppercase tracking-wide tabular-nums";

const aliveTrackerOutline = "border-neblirSafe-600 text-neblirSafe-600";

export function characterHealthStatusLabel(status: Status): string {
  return characterStatusMark(status).label;
}

export function characterHealthStatusBadgeClass(status: Status): string {
  const mark = characterStatusMark(status);
  if (
    status === "ALIVE" ||
    mark.fillClassName == null ||
    mark.borderClassName == null ||
    mark.textClassName == null
  ) {
    return `${statusBadgeBase} ${aliveTrackerOutline}`;
  }
  return `${statusBadgeBase} ${mark.fillClassName} ${mark.borderClassName} ${mark.textClassName}`;
}

export function gmCombatReactionsClassName(remaining: number): string {
  return remaining <= 0
    ? "text-xs tabular-nums text-neblirDanger"
    : "text-xs tabular-nums text-black/70";
}
