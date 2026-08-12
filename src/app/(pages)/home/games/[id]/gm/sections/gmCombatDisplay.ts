import type { Status } from "@prisma/client";

const statusBadgeBase =
  "inline-flex shrink-0 items-center rounded-full border px-2 py-px text-[10px] font-semibold uppercase tracking-wide tabular-nums";

export function characterHealthStatusLabel(status: Status): string {
  switch (status) {
    case "ALIVE":
      return "Alive";
    case "DECEASED":
      return "Deceased";
    case "DERANGED":
      return "Deranged";
    default:
      return status;
  }
}

export function characterHealthStatusBadgeClass(status: Status): string {
  switch (status) {
    case "ALIVE":
      return `${statusBadgeBase} border-neblirSafe-600 text-neblirSafe-600`;
    case "DERANGED":
      return `${statusBadgeBase} border-neblirWarning-600 text-neblirWarning-600`;
    case "DECEASED":
      return `${statusBadgeBase} border-neblirDanger-600 text-neblirDanger-600`;
    default:
      return `${statusBadgeBase} border-black/25 bg-black/5 text-black/80`;
  }
}

export function gmCombatReactionsClassName(remaining: number): string {
  return remaining <= 0
    ? "text-xs tabular-nums text-neblirDanger"
    : "text-xs tabular-nums text-black/70";
}
