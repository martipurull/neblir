import type { BotDamageMark } from "@/app/lib/botDamageProfile";
import type { BotHolding } from "@/app/lib/types/bot";

const DAMAGE_LABELS: Record<string, string> = {
  GRID: "GRID",
  ICE: "Ice",
  FIRE: "Fire",
  BLUDGEONING: "Bludgeoning",
  BULLET: "Bullet",
  BLADE: "Blade",
  NERVE: "Nerve",
  POISON: "Poison",
  SIIKE: "Siike",
  ACID: "Acid",
  ELECTRICITY: "Electricity",
  OTHER: "Other",
};

const MARK_LABELS: Record<BotDamageMark, string> = {
  VULNERABLE: "Vulnerable",
  RESISTANT: "Resistant",
  IMMUNE: "Immune",
  UNMARKED: "Unmarked",
};

const MARK_ORDER: BotDamageMark[] = [
  "VULNERABLE",
  "RESISTANT",
  "IMMUNE",
  "UNMARKED",
];

function namesForMark(
  profile: BotHolding["damageProfile"],
  mark: BotDamageMark
): string {
  return profile
    .filter((entry) => entry.mark === mark)
    .map((entry) => DAMAGE_LABELS[entry.damageType] ?? entry.damageType)
    .join(", ");
}

export function botConditionLabel(condition: BotHolding["condition"]): string {
  return condition === "BROKEN" ? "Broken" : "Operational";
}

export function botConditionClassName(
  condition: BotHolding["condition"],
  tone: "light" | "dark"
): string {
  if (condition === "OPERATIONAL") {
    return tone === "light" ? "text-neblirSafe-600" : "text-neblirSafe-400";
  }
  return tone === "light" ? "text-neblirDanger-600" : "text-neblirDanger-400";
}

export function BotDamageProfile({
  profile,
  tone,
}: {
  profile: BotHolding["damageProfile"];
  tone: "light" | "dark";
}) {
  const textClass = tone === "light" ? "text-black/70" : "text-white/75";
  return (
    <ul className={`space-y-1 text-xs ${textClass}`}>
      {MARK_ORDER.map((mark) => (
        <li key={mark}>
          <span className="font-medium">{MARK_LABELS[mark]}:</span>{" "}
          {namesForMark(profile, mark)}
        </li>
      ))}
    </ul>
  );
}
