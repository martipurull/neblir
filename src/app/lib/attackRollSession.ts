import { isD10Success } from "@/app/lib/diceResults";

export type AttackRollSessionCombatant = "character" | "enemyInstance";

export type AttackRollSessionAttack = "melee" | "range" | "throw" | "grid";

export type AttackRollWeaponOption = {
  weaponName: string;
  damageText: string;
  numberOfDice: number;
  diceType: number;
  damageDice?: ReadonlyArray<{ numberOfDice: number; diceType: number }>;
};

export type AttackRollSessionEvent =
  | {
      type: "toHitRoll";
      dice: readonly number[];
      weapon: AttackRollWeaponOption;
    }
  | { type: "changeSelectedWeapon"; weapon: AttackRollWeaponOption }
  | { type: "changeExtraDamageDice"; extraDamageDice: number }
  | { type: "changeExtraToHitDice"; extraToHitDice: number }
  | { type: "damageRoll"; dice: readonly number[] };

export type AttackRollSessionShown = {
  toHitDice: readonly number[] | null;
  dealDamage: {
    weapon: AttackRollWeaponOption;
    extraDamageDice: number;
    damageResult: readonly number[] | null;
  } | null;
  selectedWeapon: AttackRollWeaponOption | null;
  extraToHitDice: number;
};

type AttackRollSession = {
  combatant: AttackRollSessionCombatant;
  attackType: AttackRollSessionAttack;
  toHitDice: readonly number[] | null;
  frozenWeapon: AttackRollWeaponOption | null;
  selectedWeapon: AttackRollWeaponOption | null;
  extraDamageDice: number;
  damageResult: readonly number[] | null;
  extraToHitDice: number;
};

function copyWeapon(weapon: AttackRollWeaponOption): AttackRollWeaponOption {
  return {
    weaponName: weapon.weaponName,
    damageText: weapon.damageText,
    numberOfDice: weapon.numberOfDice,
    diceType: weapon.diceType,
    ...(weapon.damageDice
      ? {
          damageDice: weapon.damageDice.map((part) => ({
            numberOfDice: part.numberOfDice,
            diceType: part.diceType,
          })),
        }
      : {}),
  };
}

function toHitIsSuccess(dice: readonly number[]): boolean {
  return dice.some(isD10Success);
}

function weaponHasOwnDamageDice(weapon: AttackRollWeaponOption): boolean {
  if (weapon.damageDice && weapon.damageDice.length > 0) {
    return weapon.damageDice.some((part) => part.numberOfDice > 0);
  }
  return weapon.numberOfDice > 0;
}

function showsDealDamage(session: AttackRollSession): boolean {
  const dice = session.toHitDice;
  const weapon = session.frozenWeapon;
  if (!dice || !weapon || !toHitIsSuccess(dice)) return false;
  if (
    session.combatant === "character" &&
    session.attackType === "grid" &&
    !weaponHasOwnDamageDice(weapon)
  ) {
    return false;
  }
  return true;
}

export function openAttackRollSession(input: {
  combatant: AttackRollSessionCombatant;
  attackType: AttackRollSessionAttack;
  selectedWeapon?: AttackRollWeaponOption;
}): AttackRollSession {
  return {
    combatant: input.combatant,
    attackType: input.attackType,
    toHitDice: null,
    frozenWeapon: null,
    selectedWeapon: input.selectedWeapon
      ? copyWeapon(input.selectedWeapon)
      : null,
    extraDamageDice: 0,
    damageResult: null,
    extraToHitDice: 0,
  };
}

export function applyAttackRollSession(
  session: AttackRollSession,
  event: AttackRollSessionEvent
): AttackRollSession {
  if (event.type === "toHitRoll") {
    return {
      ...session,
      toHitDice: [...event.dice],
      frozenWeapon: copyWeapon(event.weapon),
      extraDamageDice: 0,
      damageResult: null,
    };
  }
  if (event.type === "changeSelectedWeapon") {
    return { ...session, selectedWeapon: copyWeapon(event.weapon) };
  }
  if (event.type === "changeExtraDamageDice") {
    return { ...session, extraDamageDice: event.extraDamageDice };
  }
  if (event.type === "changeExtraToHitDice") {
    return { ...session, extraToHitDice: event.extraToHitDice };
  }
  if (event.type === "damageRoll") {
    if (!showsDealDamage(session)) return session;
    return { ...session, damageResult: [...event.dice] };
  }
  return session;
}

export function attackRollSessionShown(
  session: AttackRollSession
): AttackRollSessionShown {
  const weapon = session.frozenWeapon;
  const dealDamage =
    weapon && showsDealDamage(session)
      ? {
          weapon,
          extraDamageDice: session.extraDamageDice,
          damageResult: session.damageResult,
        }
      : null;

  return {
    toHitDice: session.toHitDice,
    dealDamage,
    selectedWeapon: session.selectedWeapon,
    extraToHitDice: session.extraToHitDice,
  };
}
