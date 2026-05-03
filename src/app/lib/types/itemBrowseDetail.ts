import type {
  LevelUpAttributePath,
  LevelUpGeneralSkill,
} from "@/app/lib/levelUpPaths";
import type { ItemWithId } from "@/lib/api/items";

export type ItemBrowseDamage = {
  damageType: Array<
    | "BULLET"
    | "BLADE"
    | "SIIKE"
    | "ACID"
    | "FIRE"
    | "ICE"
    | "BLUDGEONING"
    | "ELECTRICITY"
    | "NERVE"
    | "GRID"
    | "POISON"
    | "OTHER"
  >;
  diceType: number;
  numberOfDice: number;
  areaType?: "RADIUS" | "CONE" | null;
  coneLength?: number | null;
  primaryRadius?: number | null;
  secondaryRadius?: number | null;
  areaEffect?: {
    defenceReactionCost: number;
    defenceRoll: string;
    successfulDefenceResult: string;
  } | null;
};

/** Shape used by `BrowseItemDetailModal` for global + custom items */
export type ItemBrowseDetailFields = {
  id: string;
  name: string;
  type: "GENERAL_ITEM" | "WEAPON";
  imageKey?: string | null;
  description?: string | null;
  weight?: number | null;
  confCost?: number | null;
  costInfo?: string | null;
  maxUses?: number | null;
  equippable?: boolean | null;
  equipSlotTypes?: string[] | null;
  equipSlotCost?: number | null;
  attackRoll?: string[] | null;
  attackMeleeBonus?: number | null;
  attackRangeBonus?: number | null;
  attackThrowBonus?: number | null;
  defenceMeleeBonus?: number | null;
  defenceRangeBonus?: number | null;
  gridAttackBonus?: number | null;
  gridDefenceBonus?: number | null;
  effectiveRange?: number | null;
  maxRange?: number | null;
  damage?: ItemBrowseDamage | null;
  usage?: string | null;
  notes?: string | null;
  modifiesAttribute?: LevelUpAttributePath | null;
  attributeMod?: number | null;
  modifiesSkill?: LevelUpGeneralSkill | null;
  skillMod?: number | null;
};

/** Map global catalog item to browse shape (e.g. unique-item template preview). */
export function itemWithIdToBrowseDetail(
  item: ItemWithId
): ItemBrowseDetailFields {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    imageKey: item.imageKey ?? null,
    description: item.description,
    weight: item.weight,
    confCost: item.confCost,
    costInfo: item.costInfo ?? null,
    maxUses: item.maxUses ?? null,
    equippable: item.equippable ?? null,
    equipSlotTypes: item.equipSlotTypes ?? null,
    equipSlotCost: item.equipSlotCost ?? null,
    attackRoll: item.attackRoll ?? null,
    attackMeleeBonus: item.attackMeleeBonus ?? null,
    attackRangeBonus: item.attackRangeBonus ?? null,
    attackThrowBonus: item.attackThrowBonus ?? null,
    defenceMeleeBonus: item.defenceMeleeBonus ?? null,
    defenceRangeBonus: item.defenceRangeBonus ?? null,
    gridAttackBonus: item.gridAttackBonus ?? null,
    gridDefenceBonus: item.gridDefenceBonus ?? null,
    effectiveRange: item.effectiveRange ?? null,
    maxRange: item.maxRange ?? null,
    damage: item.damage as ItemBrowseDetailFields["damage"],
    usage: item.usage ?? null,
    notes: item.notes ?? null,
    modifiesAttribute: item.modifiesAttribute ?? null,
    attributeMod: item.attributeMod ?? null,
    modifiesSkill: item.modifiesSkill ?? null,
    skillMod: item.skillMod ?? null,
  };
}
