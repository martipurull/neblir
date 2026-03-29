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
};
