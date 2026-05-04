import type { AttackModifierOption } from "@/app/lib/equipCombatUtils";
import type {
  EnemyInstanceDetailResponse,
  EnemyInstancePatch,
} from "@/lib/api/enemyInstances";

export type EnemyInstanceStatus = "ACTIVE" | "DEFEATED" | "DEAD";

export function enemyStatusLabel(status: EnemyInstanceStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "DEFEATED":
      return "Defeated";
    case "DEAD":
      return "Dead";
    default:
      return status;
  }
}

export function enemyStatusBadgeClass(status: EnemyInstanceStatus): string {
  const base =
    "inline-flex shrink-0 items-center rounded-full border px-2 py-px text-[10px] font-semibold uppercase tracking-wide tabular-nums";
  switch (status) {
    case "ACTIVE":
      return `${base} border-neblirSafe-600 text-neblirSafe-600`;
    case "DEFEATED":
      return `${base} border-neblirWarning-600 text-neblirWarning-600`;
    case "DEAD":
      return `${base} border-neblirDanger-600 text-neblirDanger-600`;
    default:
      return `${base} border-black/25 bg-black/5 text-black/80`;
  }
}

export function mergeEnemyInstancePatch(
  prev: EnemyInstanceDetailResponse,
  patch: EnemyInstancePatch
): EnemyInstanceDetailResponse {
  return { ...prev, ...patch };
}

export function rollD10(times: number): number[] {
  return Array.from(
    { length: times },
    () => 1 + Math.floor(Math.random() * 10)
  );
}

export function rollDice(times: number, dieSize: number): number[] {
  return Array.from(
    { length: times },
    () => 1 + Math.floor(Math.random() * Math.max(1, dieSize))
  );
}

export function enemyAttackOption(
  mod: number,
  label: string
): AttackModifierOption {
  return {
    mod,
    weaponName: label,
    damageText: "",
    numberOfDice: 0,
    diceType: 4,
  };
}

export function enemyHpBarTone(
  current: number,
  max: number
): {
  bar: string;
  track: string;
  text: string;
} {
  if (max <= 0) {
    return {
      bar: "bg-neblirSafe-600",
      track: "bg-black/10",
      text: "text-neblirSafe-600",
    };
  }
  const ratio = current / max;
  if (ratio > 0.75) {
    return {
      bar: "bg-neblirSafe-600",
      track: "bg-neblirSafe-200/60",
      text: "text-neblirSafe-600",
    };
  }
  if (ratio >= 0.3) {
    return {
      bar: "bg-neblirWarning-400",
      track: "bg-neblirWarning-200/50",
      text: "text-neblirWarning-600",
    };
  }
  return {
    bar: "bg-neblirDanger-600",
    track: "bg-neblirDanger-200/50",
    text: "text-neblirDanger-600",
  };
}
