import type { EquipSlotType, Item, ItemDamage } from "@/app/lib/types/item";
import type { z } from "zod";
import type { weaponAttackRollTypeSchema } from "@/app/lib/types/item";

type ItemWeaponAttackRollChoice = z.infer<typeof weaponAttackRollTypeSchema>;

export type SuperAdminItemFormValues = {
  itemType: "GENERAL_ITEM" | "WEAPON";
  accessType: "PLAYER" | "GAME_MASTER";
  name: string;
  description: string;
  confCost: number;
  costInfo: string;
  weight: number;
  usage: string;
  notes: string;
  attackRoll: ItemWeaponAttackRollChoice[];
  attackMeleeBonus?: number;
  attackRangeBonus?: number;
  attackThrowBonus?: number;
  defenceMeleeBonus?: number;
  defenceRangeBonus?: number;
  gridAttackBonus?: number;
  gridDefenceBonus?: number;
  effectiveRange?: number;
  maxRange?: number;
  damageTypes: string[];
  damageDiceType: number;
  damageNumberOfDice: number;
  equippable: boolean;
  equipSlotTypes: EquipSlotType[];
  equipSlotCost: string;
  maxUses?: number;
  modifiesAttribute: string;
  attributeMod?: number;
  modifiesSkill: string;
  skillMod?: number;
  isSpeedAltered: boolean;
};

function numOrUndefined(n: number | null | undefined): number | undefined {
  return n ?? undefined;
}

function damageToForm(damage: ItemDamage | null | undefined) {
  if (!damage) {
    return {
      damageTypes: [] as string[],
      damageDiceType: 6,
      damageNumberOfDice: 1,
    };
  }
  return {
    damageTypes: damage.damageType ?? [],
    damageDiceType: damage.diceType,
    damageNumberOfDice: damage.numberOfDice,
  };
}

/** Map a catalogue item from GET /api/items/[id] into super-admin form state. */
export function catalogueItemToFormValues(
  item: Item & { imageKey?: string | null }
): SuperAdminItemFormValues {
  const isWeapon = item.type === "WEAPON";
  const damageFields = isWeapon
    ? damageToForm(item.damage)
    : { damageTypes: [], damageDiceType: 6, damageNumberOfDice: 1 };

  return {
    itemType: item.type,
    accessType: item.accessType,
    name: item.name,
    description: item.description ?? "",
    confCost: item.confCost,
    costInfo: item.costInfo ?? "",
    weight: item.weight,
    usage: item.usage ?? "",
    notes: item.notes ?? "",
    attackRoll: isWeapon ? [...(item.attackRoll ?? ["MELEE"])] : ["MELEE"],
    attackMeleeBonus: numOrUndefined(
      isWeapon ? item.attackMeleeBonus : undefined
    ),
    attackRangeBonus: numOrUndefined(
      isWeapon ? item.attackRangeBonus : undefined
    ),
    attackThrowBonus: numOrUndefined(
      isWeapon ? item.attackThrowBonus : undefined
    ),
    defenceMeleeBonus: numOrUndefined(
      isWeapon ? item.defenceMeleeBonus : undefined
    ),
    defenceRangeBonus: numOrUndefined(
      isWeapon ? item.defenceRangeBonus : undefined
    ),
    gridAttackBonus: numOrUndefined(
      isWeapon ? item.gridAttackBonus : undefined
    ),
    gridDefenceBonus: numOrUndefined(
      isWeapon ? item.gridDefenceBonus : undefined
    ),
    effectiveRange: numOrUndefined(isWeapon ? item.effectiveRange : undefined),
    maxRange: numOrUndefined(isWeapon ? item.maxRange : undefined),
    ...damageFields,
    equippable: item.equippable,
    equipSlotTypes: item.equipSlotTypes ?? [],
    equipSlotCost:
      item.equipSlotCost === null || item.equipSlotCost === undefined
        ? ""
        : String(item.equipSlotCost),
    maxUses: numOrUndefined(item.maxUses),
    modifiesAttribute: item.modifiesAttribute ?? "",
    attributeMod: numOrUndefined(item.attributeMod),
    modifiesSkill: item.modifiesSkill ?? "",
    skillMod: numOrUndefined(item.skillMod),
    isSpeedAltered: item.isSpeedAltered ?? false,
  };
}

export function catalogueItemImageKey(
  item: Item & { imageKey?: string | null }
): string {
  return item.imageKey?.trim() ?? "";
}
