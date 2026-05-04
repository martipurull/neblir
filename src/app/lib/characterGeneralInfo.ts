import type { Race } from "@prisma/client";
import {
  getSpecialAbilityDescription,
  getSpecialAbilityLabel,
  type SpecialAbilityName,
} from "@/app/lib/specialAbility";

export const HEIGHT_HELP_BY_RACE: Record<Race, string> = {
  HUMAN:
    "Humans are about 1.70m tall for an adult human, with women typically a bit shorter and men a bit taller.",
  KINIAN:
    "Kinians are over 2.10m tall, with women typically a bit taller and men a bit shorter.",
  FENNE:
    "Fenne are small and agile, typically below 1.5m tall, with no significant difference between men and women.",
  MANFENN:
    "Manfenn vary widely in height; use your character concept and lineage to guide this.",
};

export const WEIGHT_HELP_BY_RACE: Record<Race, string> = {
  HUMAN:
    "Humans weigh about 70-80 kilograms, with women typically a bit lighter and men heavier.",
  KINIAN:
    "Kinians weigh over 120-140 kilograms, with women typically a bit lighter, and men heavier.",
  FENNE:
    "Fenne are light creatures, weighing around 40 kilograms, with no significant differences between men and women.",
  MANFENN:
    "Manfenn vary widely in weight; use your character concept and lineage to guide this.",
};

export const SIZE_DEFAULTS_BY_RACE: Record<
  Race,
  { height: number; weight: number }
> = {
  HUMAN: { height: 170, weight: 75 },
  KINIAN: { height: 215, weight: 130 },
  FENNE: { height: 145, weight: 40 },
  MANFENN: { height: 160, weight: 60 },
};

export function getSpecialAbilityValuesForRace(
  race: Race
): SpecialAbilityName[] {
  if (race === "MANFENN") {
    return ["INNATE_MANIPULATION", "DOUBLE_OPPOSABLE_THUMBS"];
  }
  if (race === "KINIAN") return ["TELEPATHY_DARKVISION"];
  if (race === "FENNE") return ["DOUBLE_OPPOSABLE_THUMBS"];
  return ["INNATE_MANIPULATION"];
}

export function getSpecialAbilityOptionsForRace(race: Race): Array<{
  value: SpecialAbilityName;
  label: string;
}> {
  return getSpecialAbilityValuesForRace(race).map((value) => ({
    value,
    label: getSpecialAbilityLabel(value),
  }));
}

export function getSelectedSpecialAbilityDescription(
  value: string | undefined
): string {
  if (
    value === "INNATE_MANIPULATION" ||
    value === "TELEPATHY_DARKVISION" ||
    value === "DOUBLE_OPPOSABLE_THUMBS"
  ) {
    return getSpecialAbilityDescription(value);
  }
  return "";
}
