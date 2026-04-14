import { getCarriedInventory } from "./constants/inventory";
import type { CharacterDetail } from "./types/character";

type InventoryEntry = {
  id?: string;
  currentUses?: number;
  equipSlots?: string[];
  itemLocation?: string | null;
  item?: {
    attackRoll?: string[] | readonly string[];
    attackMeleeBonus?: number | null;
    attackRangeBonus?: number | null;
    attackThrowBonus?: number | null;
    defenceMeleeBonus?: number | null;
    defenceRangeBonus?: number | null;
    gridAttackBonus?: number | null;
    gridDefenceBonus?: number | null;
    maxUses?: number | null;
    damage?: {
      numberOfDice: number;
      diceType: number;
      damageType: string[];
    } | null;
  } | null;
};

function isEquippedInBrainSlot(entry: { equipSlots?: string[] }): boolean {
  return (entry.equipSlots ?? []).some((s) => s === "BRAIN");
}

/**
 * Brain-equipped GRID patches do not stack: only the highest `gridAttackBonus`
 * and the highest `gridDefenceBonus` count (each stat is max-only, independently).
 * Entries out of uses are skipped. Attack ties keep the first patch in carried order.
 */
function getNonStackingEquippedBrainGridBonuses(character: CharacterDetail): {
  maxAttackBonus: number;
  maxDefenceBonus: number;
  bestAttackPatch: {
    itemCharacterId: string;
    item: NonNullable<InventoryEntry["item"]>;
  } | null;
} {
  const carried = getCarriedInventory(character.inventory ?? undefined);
  let maxAttackBonus = 0;
  let maxDefenceBonus = 0;
  let bestAttackPatch: {
    itemCharacterId: string;
    item: NonNullable<InventoryEntry["item"]>;
  } | null = null;

  for (const entry of carried) {
    if (!isEquippedInBrainSlot(entry)) continue;
    const item = entry.item;
    if (!item) continue;

    const itemMaxUses = item.maxUses ?? null;
    const currentUses = entry.currentUses ?? 0;
    if (itemMaxUses != null && currentUses <= 0) continue;

    const atk = item.gridAttackBonus ?? 0;
    const def = item.gridDefenceBonus ?? 0;

    maxDefenceBonus = Math.max(maxDefenceBonus, def);

    if (atk > maxAttackBonus) {
      maxAttackBonus = atk;
      if (entry.id != null && atk > 0) {
        bestAttackPatch = { itemCharacterId: entry.id, item };
      }
    }
  }

  return { maxAttackBonus, maxDefenceBonus, bestAttackPatch };
}

/** One attack modifier option (one weapon): mod value plus label for the modal. */
export type AttackModifierOption = {
  mod: number;
  weaponName: string;
  damageText: string;
  /** Number of damage dice (e.g. 2 for 2d6) */
  numberOfDice: number;
  /** Dice type (e.g. 6 for d6) */
  diceType: number;
  /** When set, weapon has limited uses; decrement on attack */
  itemCharacterId?: string;
  /**
   * Optional full breakdown of damage dice to roll (for cases like GRID where bonuses add a different dice type).
   * This represents the non-GM part of damage; GM extra dice are handled separately in the modal.
   */
  damageDice?: Array<{ numberOfDice: number; diceType: number }>;
};

function formatWeaponDamage(
  damage:
    | {
        numberOfDice: number;
        diceType: number;
        damageType: string[];
      }
    | null
    | undefined
): string {
  if (!damage?.damageType?.length) return "";
  const dice = `${damage.numberOfDice}d${damage.diceType}`;
  const types = damage.damageType.map((t) => t.toLowerCase()).join(", ");
  return `${dice}, ${types}`;
}

/** Per-weapon attack modifier options (one per HAND weapon of that type). Used for display "+8 / +7" and attack roll modal with weapon labels. */
export function getAttackModifierArrays(character: CharacterDetail): {
  melee: AttackModifierOption[];
  range: AttackModifierOption[];
  throw: AttackModifierOption[];
} {
  const { innateAttributes, learnedSkills, inventory } = character;
  const carried = getCarriedInventory(inventory ?? undefined);
  const gs = learnedSkills.generalSkills;
  const baseMelee = innateAttributes.strength.bruteForce + gs.melee;
  const baseRange = innateAttributes.dexterity.manual + gs.aim;
  const baseThrow = innateAttributes.strength.athletics + gs.aim;

  const unarmedMelee: AttackModifierOption = {
    mod: baseMelee,
    weaponName: "Unarmed",
    damageText: "1d4, bludgeoning",
    numberOfDice: 1,
    diceType: 4,
  };

  const improvisedRange: AttackModifierOption = {
    mod: baseRange,
    weaponName: "Improvised weapon",
    damageText: "1d4, bludgeoning",
    numberOfDice: 1,
    diceType: 4,
  };

  const unarmedThrow: AttackModifierOption = {
    mod: baseThrow,
    weaponName: "Unarmed",
    damageText: "1d4, bludgeoning",
    numberOfDice: 1,
    diceType: 4,
  };

  const melee: AttackModifierOption[] = [unarmedMelee];
  const range: AttackModifierOption[] = [improvisedRange];
  const throwMods: AttackModifierOption[] = [unarmedThrow];

  if (!carried.length) {
    return {
      melee: [unarmedMelee],
      range: [improvisedRange],
      throw: [unarmedThrow],
    };
  }

  for (const entry of carried) {
    const slots = entry.equipSlots ?? [];
    const handCount = slots.filter((s) => s === "HAND").length;
    if (handCount === 0 || !entry.item) continue;

    const itemMaxUses = entry.item.maxUses ?? null;
    const currentUses = entry.currentUses ?? 0;
    if (itemMaxUses != null && currentUses <= 0) continue;

    const roll = entry.item.attackRoll ?? [];
    const meleeBonus = entry.item.attackMeleeBonus ?? 0;
    const rangeBonus = entry.item.attackRangeBonus ?? 0;
    const throwBonus = entry.item.attackThrowBonus ?? 0;
    const weaponName = entry.customName ?? entry.item.name ?? "—";
    const dmg = entry.item.damage as
      | { numberOfDice: number; diceType: number; damageType: string[] }
      | undefined;
    const damageText = formatWeaponDamage(dmg);
    const numberOfDice = dmg?.numberOfDice ?? 1;
    const diceType = dmg?.diceType ?? 4;
    const itemCharacterId = entry.id;

    for (let i = 0; i < handCount; i++) {
      if (roll.includes("MELEE"))
        melee.push({
          mod: baseMelee + meleeBonus,
          weaponName,
          damageText,
          numberOfDice,
          diceType,
          itemCharacterId,
        });
      if (roll.includes("RANGE"))
        range.push({
          mod: baseRange + rangeBonus,
          weaponName,
          damageText,
          numberOfDice,
          diceType,
          itemCharacterId,
        });
      if (roll.includes("THROW"))
        throwMods.push({
          mod: baseThrow + throwBonus,
          weaponName,
          damageText,
          numberOfDice,
          diceType,
          itemCharacterId,
        });
    }
  }

  return {
    melee,
    range,
    throw: throwMods,
  };
}

export function getGridAttackRollData(character: CharacterDetail): {
  /** Best GRID attack bonus from an item equipped in the Brain slot (carried). */
  gridMod: number;
  /** Dice count for GRID attack roll: Mentality + GRID skill + best item mod. */
  gridAttackDice: number;
  /**
   * Primary damage line for display: patch weapon damage if any, otherwise Software Warrior d6 only.
   */
  damage: {
    numberOfDice: number;
    diceType: number;
    damageText: string;
  } | null;
  /** Patch dice plus Software Warrior d6 (SW applies at grades 1+ even with no patch). */
  damageDice?: Array<{ numberOfDice: number; diceType: number }>;
  /** Best GRID-mod item's itemCharacter id (for decrementing limited uses). */
  itemCharacterId?: string;
  /** Short explainer for equipped GRID patch damage in the attack modal (if patch deals damage). */
  gridPatchDamageHint?: string;
} {
  const { innateAttributes, learnedSkills, features } = character;

  const baseDice =
    innateAttributes.personality.mentality + learnedSkills.generalSkills.GRID;

  const { maxAttackBonus: bestGridBonus, bestAttackPatch } =
    getNonStackingEquippedBrainGridBonuses(character);

  let bestDamage: {
    numberOfDice: number;
    diceType: number;
    damageText: string;
  } | null = null;

  if (bestAttackPatch) {
    const dmg = bestAttackPatch.item.damage ?? null;
    const numberOfDice = dmg?.numberOfDice ?? 0;
    const diceType = dmg?.diceType ?? 4;
    bestDamage =
      numberOfDice > 0
        ? {
            numberOfDice,
            diceType,
            damageText: formatWeaponDamage(dmg ?? undefined),
          }
        : null;
  }

  const softwareWarriorFeature = features?.find(
    (f) => f.feature.name === "Software Warrior"
  );
  const softwareWarriorGrade = softwareWarriorFeature?.grade ?? 0;
  /** Grades 1–3: +1d6; grade 4+: +2d6. Stacks with Brain patch GRID damage; applies with no patch. */
  const softwareWarriorBonusD6 =
    softwareWarriorGrade >= 4 ? 2 : softwareWarriorGrade >= 1 ? 1 : 0;

  const damageDiceParts: Array<{ numberOfDice: number; diceType: number }> = [];
  if (bestDamage && bestDamage.numberOfDice > 0) {
    damageDiceParts.push({
      numberOfDice: bestDamage.numberOfDice,
      diceType: bestDamage.diceType,
    });
  }
  if (softwareWarriorBonusD6 > 0) {
    damageDiceParts.push({
      numberOfDice: softwareWarriorBonusD6,
      diceType: 6,
    });
  }

  const damageDice = damageDiceParts.length > 0 ? damageDiceParts : undefined;

  const damage =
    bestDamage ??
    (softwareWarriorBonusD6 > 0
      ? {
          numberOfDice: softwareWarriorBonusD6,
          diceType: 6,
          damageText: softwareWarriorBonusD6 === 2 ? "2d6" : "1d6",
        }
      : null);

  const gridPatchDamageHint =
    bestDamage && bestDamage.numberOfDice > 0
      ? bestDamage.damageText.trim().length > 0
        ? `GRID patch: ${bestDamage.damageText}`
        : `GRID patch: ${bestDamage.numberOfDice}d${bestDamage.diceType} damage`
      : undefined;

  return {
    gridMod: bestGridBonus,
    gridAttackDice: baseDice + bestGridBonus,
    damage,
    damageDice,
    itemCharacterId: bestAttackPatch?.itemCharacterId,
    gridPatchDamageHint,
  };
}

/** GRID attack modal options: weaponless; item bonus from Brain-equipped carried items only. */
export function getGridAttackModifierOptions(
  character: CharacterDetail
): AttackModifierOption[] {
  const { gridAttackDice, damage, damageDice, itemCharacterId } =
    getGridAttackRollData(character);

  return [
    {
      mod: gridAttackDice,
      weaponName: "GRID",
      damageText: damage?.damageText ?? "",
      numberOfDice: damage?.numberOfDice ?? 0,
      diceType: damage?.diceType ?? 4,
      itemCharacterId,
      damageDice,
    },
  ];
}

/**
 * Best grid attack/defence bonuses from Brain-equipped carried items.
 * Patches do not stack: see `getNonStackingEquippedBrainGridBonuses`.
 */
export function getEquippedBrainGridBonusesDisplay(
  character: CharacterDetail
): {
  gridAttackBonus: number;
  gridDefenceBonus: number;
} {
  const { maxAttackBonus, maxDefenceBonus } =
    getNonStackingEquippedBrainGridBonuses(character);
  return {
    gridAttackBonus: maxAttackBonus,
    gridDefenceBonus: maxDefenceBonus,
  };
}

/** GRID defence d10 dice: Mentality + GRID skill + best Brain-equipped `gridDefenceBonus`. */
export function getGridDefenceDice(character: CharacterDetail): number {
  const base =
    character.innateAttributes.personality.mentality +
    character.learnedSkills.generalSkills.GRID;
  return base + getEquippedBrainGridBonusesDisplay(character).gridDefenceBonus;
}

/** Armour defence bonuses from BODY/HEAD-equipped items (carried only) */
export function getArmourBonusesFromInventory(
  inventory: InventoryEntry[] | undefined
): { melee: number; range: number } {
  const result = { melee: 0, range: 0 };
  const carried = getCarriedInventory(inventory);
  if (!carried.length) return result;

  for (const entry of carried) {
    const slots = entry.equipSlots ?? [];
    const bodyHeadCount = slots.filter(
      (s) => s === "BODY" || s === "HEAD"
    ).length;
    if (bodyHeadCount === 0 || !entry.item) continue;

    const meleeBonus = entry.item.defenceMeleeBonus ?? 0;
    const rangeBonus = entry.item.defenceRangeBonus ?? 0;

    for (let i = 0; i < bodyHeadCount; i++) {
      result.melee += meleeBonus;
      result.range += rangeBonus;
    }
  }
  return result;
}

/** Armour display values for the Armour StatCell (only from equipped armour) */
export function getArmourDisplayFromInventory(
  inventory: InventoryEntry[] | undefined,
  storedArmourCurrentHP: number
): { armourMod: number; armourMaxHP: number; armourCurrentHP: number } {
  const armourBonuses = getArmourBonusesFromInventory(inventory);
  const armourMod = Math.max(armourBonuses.melee, armourBonuses.range);
  const armourMaxHP = armourMod * 5;
  const hasArmour = armourMod > 0;
  const armourCurrentHP = hasArmour
    ? Math.min(storedArmourCurrentHP, armourMaxHP)
    : 0;

  return {
    armourMod,
    armourMaxHP,
    armourCurrentHP,
  };
}

/** Effective combat mods including weapon and armour bonuses from equipment. Attack mods use max of per-weapon modifiers for DB/API. */
export function getEffectiveCombatMods(character: CharacterDetail): {
  meleeAttackMod: number;
  rangeAttackMod: number;
  throwAttackMod: number;
  meleeDefenceMod: number;
  rangeDefenceMod: number;
} {
  const { innateAttributes, learnedSkills, inventory } = character;
  const gs = learnedSkills.generalSkills;

  const baseMeleeDef = innateAttributes.strength.resilience + gs.melee;
  const baseRangeDef = innateAttributes.dexterity.agility + gs.acrobatics;

  const attackArrays = getAttackModifierArrays(character);
  const armourBonuses = getArmourBonusesFromInventory(inventory ?? undefined);

  return {
    meleeAttackMod: Math.max(0, ...attackArrays.melee.map((o) => o.mod)),
    rangeAttackMod: Math.max(0, ...attackArrays.range.map((o) => o.mod)),
    throwAttackMod: Math.max(0, ...attackArrays.throw.map((o) => o.mod)),
    meleeDefenceMod: baseMeleeDef + armourBonuses.melee,
    rangeDefenceMod: baseRangeDef + armourBonuses.range,
  };
}

/** Character shape accepted for combat sync (e.g. from getCharacter) */
export type CharacterForCombatSync = {
  innateAttributes: CharacterDetail["innateAttributes"];
  learnedSkills: CharacterDetail["learnedSkills"];
  combatInformation?: { armourCurrentHP?: number };
  inventory?: Array<{
    itemLocation?: string | null;
    equipSlots?: string[];
    item?: {
      attackRoll?: string[] | readonly string[];
      attackMeleeBonus?: number | null;
      attackRangeBonus?: number | null;
      attackThrowBonus?: number | null;
      defenceMeleeBonus?: number | null;
      defenceRangeBonus?: number | null;
    } | null;
  }> | null;
};

/** Compute combat info update when equipment changes (for inventory PATCH) */
export function computeCombatInfoUpdateForCharacter(
  character: CharacterForCombatSync
): {
  armourMod: number;
  armourMaxHP: number;
  armourCurrentHP: number;
  meleeAttackMod: number;
  rangeAttackMod: number;
  throwAttackMod: number;
  meleeDefenceMod: number;
  rangeDefenceMod: number;
} {
  const carried = getCarriedInventory(character.inventory ?? undefined);
  const armourDisplay = getArmourDisplayFromInventory(
    carried,
    character.combatInformation?.armourCurrentHP ?? 0
  );
  const mods = getEffectiveCombatMods(character as CharacterDetail);

  const hasArmour = armourDisplay.armourMod > 0;
  const armourCurrentHP = hasArmour ? armourDisplay.armourMaxHP : 0;

  return {
    armourMod: armourDisplay.armourMod,
    armourMaxHP: armourDisplay.armourMaxHP,
    armourCurrentHP,
    meleeAttackMod: mods.meleeAttackMod,
    rangeAttackMod: mods.rangeAttackMod,
    throwAttackMod: mods.throwAttackMod,
    meleeDefenceMod: mods.meleeDefenceMod,
    rangeDefenceMod: mods.rangeDefenceMod,
  };
}
