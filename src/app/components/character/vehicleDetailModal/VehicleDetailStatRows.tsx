import { Button } from "@/app/components/shared/Button";
import type { VehicleCharacter } from "@/app/lib/types/vehicle";

export const VEHICLE_STATUS_LABELS = {
  OPERATIONAL: "Operational",
  BROKEN_DOWN: "Broken down",
  BEYOND_REPAIR: "Beyond repair",
} as const;

export function locomotionLabel(modes: string[] | undefined): string {
  if (!modes?.length) return "—";
  return modes.join(" · ");
}

export function statusClassName(entry: VehicleCharacter): string {
  if (entry.derivedStatus === "OPERATIONAL") {
    return "border-neblirSafe-400 text-neblirSafe-400";
  }
  if (entry.derivedStatus === "BROKEN_DOWN") {
    return "border-neblirWarning-400 text-neblirWarning-400";
  }
  return "border-neblirDanger-400 text-neblirDanger-400";
}

/** Current HP cell: warning below 50%, danger below 25%. */
function vehicleCurrentHpToneClasses(
  currentHp: number,
  maxHp: number
): { borderClassName: string; valueClassName: string } {
  if (maxHp <= 0) {
    return {
      borderClassName: "border-white/10",
      valueClassName: "text-white",
    };
  }
  const ratio = currentHp / maxHp;
  if (ratio < 0.25) {
    return {
      borderClassName: "border-neblirDanger-400",
      valueClassName: "text-neblirDanger-400",
    };
  }
  if (ratio < 0.5) {
    return {
      borderClassName: "border-neblirWarning-400",
      valueClassName: "text-neblirWarning-400",
    };
  }
  return {
    borderClassName: "border-white/10",
    valueClassName: "text-white",
  };
}

export function DetailRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number | null | undefined;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-white/60">
        {label}
      </div>
      {hint ? <p className="mt-0.5 text-[10px] text-white/50">{hint}</p> : null}
      <div className="mt-1 text-sm text-white">
        {value == null || value === "" ? "—" : value}
      </div>
    </div>
  );
}

export function CurrentHpAdjustRow({
  currentHp,
  maxHp,
  disabled,
  onAdjust,
}: {
  currentHp: number;
  maxHp: number | null;
  disabled: boolean;
  onAdjust: (delta: number) => void;
}) {
  const tone = vehicleCurrentHpToneClasses(currentHp, maxHp ?? 0);
  return (
    <div
      className={`rounded-md border bg-white/5 px-3 py-2 ${tone.borderClassName}`}
    >
      <div className="text-[11px] uppercase tracking-wider text-white/60">
        Current HP
      </div>
      <div className="mt-1 flex items-center gap-2">
        <Button
          type="button"
          variant="modalIconStepper"
          fullWidth={false}
          className="disabled:!opacity-40"
          onClick={() => onAdjust(-1)}
          disabled={disabled || currentHp <= 0}
          aria-label="Decrease current HP"
        >
          −
        </Button>
        <span
          className={`min-w-[2.5rem] text-center text-sm font-bold ${tone.valueClassName}`}
        >
          {currentHp}
        </span>
        <Button
          type="button"
          variant="modalIconStepper"
          fullWidth={false}
          className="disabled:!opacity-40"
          onClick={() => onAdjust(1)}
          disabled={
            disabled || (maxHp != null && maxHp > 0 && currentHp >= maxHp)
          }
          aria-label="Increase current HP"
        >
          +
        </Button>
      </div>
    </div>
  );
}
