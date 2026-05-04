import type { SelectDropdownOption } from "@/app/components/shared/SelectDropdown";
import { weaponDamageTypeSchema } from "@/app/lib/types/item";

/** Damage-roll “sides” options for character + enemy instance damage rollers (keep in sync). */
export const DAMAGE_DICE_OPTIONS: SelectDropdownOption[] = [
  { value: "d4", label: "d4" },
  { value: "d6", label: "d6" },
  { value: "d8", label: "d8" },
  { value: "d10", label: "d10" },
];

export const DAMAGE_TYPE_OPTIONS: SelectDropdownOption[] =
  weaponDamageTypeSchema.options.map((value) => ({
    value,
    label: value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " "),
  }));
