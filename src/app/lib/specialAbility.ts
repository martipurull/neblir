import type { Race } from "@prisma/client";

export const specialAbilityNameSchemaValues = [
  "INNATE_MANIPULATION",
  "TELEPATHY_DARKVISION",
  "DOUBLE_OPPOSABLE_THUMBS",
] as const;

export type SpecialAbilityName =
  (typeof specialAbilityNameSchemaValues)[number];

export type CharacterSpecialAbility = {
  name: SpecialAbilityName;
  description: string;
};

const SPECIAL_ABILITY_DESCRIPTIONS: Record<SpecialAbilityName, string> = {
  INNATE_MANIPULATION:
    "Can naturally influence social interactions and negotiations: additional 1d10 to any roll involving the Manipulation skill.",
  TELEPATHY_DARKVISION:
    "Can see normally in low light conditions and communicate telepathically at short range with other Kinians they have an emotional connection with (100 metres, max of several kilometres at GM’s discretion with very close friends/family).",
  DOUBLE_OPPOSABLE_THUMBS:
    "Has advanced manual dexterity thanks to double opposable thumbs: additional 2d10 to Manual-based rolls to manipulate objects.",
};

const RACE_FIXED_SPECIAL_ABILITY: Partial<Record<Race, SpecialAbilityName>> = {
  HUMAN: "INNATE_MANIPULATION",
  KINIAN: "TELEPATHY_DARKVISION",
  FENNE: "DOUBLE_OPPOSABLE_THUMBS",
};

export const MANFENN_SPECIAL_ABILITY_CHOICES: SpecialAbilityName[] = [
  "INNATE_MANIPULATION",
  "DOUBLE_OPPOSABLE_THUMBS",
];

export function resolveSpecialAbilityForRace(
  race: Race,
  preferredName?: SpecialAbilityName | null
): CharacterSpecialAbility {
  const fixed = RACE_FIXED_SPECIAL_ABILITY[race];
  if (fixed) {
    return { name: fixed, description: SPECIAL_ABILITY_DESCRIPTIONS[fixed] };
  }

  if (race === "MANFENN") {
    const selected =
      preferredName && MANFENN_SPECIAL_ABILITY_CHOICES.includes(preferredName)
        ? preferredName
        : "INNATE_MANIPULATION";
    return {
      name: selected,
      description: SPECIAL_ABILITY_DESCRIPTIONS[selected],
    };
  }

  return {
    name: "INNATE_MANIPULATION",
    description: SPECIAL_ABILITY_DESCRIPTIONS.INNATE_MANIPULATION,
  };
}

export function getSpecialAbilityLabel(name: SpecialAbilityName): string {
  if (name === "INNATE_MANIPULATION") return "Innate Manipulation";
  if (name === "TELEPATHY_DARKVISION") return "Telepathy + Darkvision";
  return "Double Opposable Thumbs";
}

export function getSpecialAbilityDescription(name: SpecialAbilityName): string {
  return SPECIAL_ABILITY_DESCRIPTIONS[name];
}
