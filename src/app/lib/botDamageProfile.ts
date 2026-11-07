import type { WeaponDamageType } from "@/app/lib/types/item";

export const BOT_DAMAGE_MARKS = [
  "VULNERABLE",
  "RESISTANT",
  "IMMUNE",
  "UNMARKED",
] as const;

export type BotDamageMark = (typeof BOT_DAMAGE_MARKS)[number];

export type BotDamageProfileEntry = {
  damageType: WeaponDamageType;
  mark: BotDamageMark;
};

/**
 * Every bot shows this profile. It is not stored on the template and does not
 * change rolls.
 */
export const BOT_DAMAGE_PROFILE: readonly BotDamageProfileEntry[] = [
  { damageType: "GRID", mark: "VULNERABLE" },
  { damageType: "ICE", mark: "RESISTANT" },
  { damageType: "FIRE", mark: "RESISTANT" },
  { damageType: "BLUDGEONING", mark: "RESISTANT" },
  { damageType: "BULLET", mark: "RESISTANT" },
  { damageType: "BLADE", mark: "RESISTANT" },
  { damageType: "NERVE", mark: "IMMUNE" },
  { damageType: "POISON", mark: "IMMUNE" },
  { damageType: "SIIKE", mark: "UNMARKED" },
  { damageType: "ACID", mark: "UNMARKED" },
  { damageType: "ELECTRICITY", mark: "UNMARKED" },
  { damageType: "OTHER", mark: "UNMARKED" },
];
