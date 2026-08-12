import { enemyHpBarTone } from "@/app/(pages)/home/games/[id]/gm/enemies/[enemyInstanceId]/enemyInstanceUtils";

type GmCombatHpDisplayProps = {
  currentHealth: number;
  maxHealth: number;
};

export function GmCombatHpDisplay({
  currentHealth,
  maxHealth,
}: GmCombatHpDisplayProps) {
  const hpTone = enemyHpBarTone(currentHealth, maxHealth);
  return (
    <p className="text-lg font-bold leading-none tabular-nums tracking-tight">
      <span className={hpTone.text}>{currentHealth}</span>
      <span className="text-black">
        {" / "}
        {maxHealth}
      </span>
      <span className="ml-1.5 text-xs font-semibold uppercase tracking-wide text-black/55">
        HP
      </span>
    </p>
  );
}
