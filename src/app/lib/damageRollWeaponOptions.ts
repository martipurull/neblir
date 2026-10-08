import {
  getAttackModifierArrays,
  getGridAttackModifierOptions,
  type AttackModifierOption,
} from "@/app/lib/equipCombatUtils";
import type { CharacterDetail } from "@/app/lib/types/character";

type DamageRollAttackMode = "melee" | "range" | "throw" | "grid";

type DamageRollDice = {
  numberOfDice: number;
  diceType: number;
};

/** One damage-roll row: an attack mode, its display name, and the dice it already has. */
export type DamageRollWeaponOption = {
  attackMode: DamageRollAttackMode;
  displayName: string;
  /** Sheet row, e.g. "Sword — Melee — 2d6, blade". */
  label: string;
  damageDice: DamageRollDice[];
  /** Die added or removed by extra damage dice, matching Deal Damage. */
  extraDiceType: number;
};

const ATTACK_MODE_LABEL: Record<DamageRollAttackMode, string> = {
  melee: "Melee",
  range: "Range",
  throw: "Throw",
  grid: "GRID",
};

function damageDiceFor(option: AttackModifierOption): DamageRollDice[] {
  const listed = option.damageDice?.filter((die) => die.numberOfDice > 0);
  if (listed && listed.length > 0) return listed;
  if (option.numberOfDice > 0) {
    return [{ numberOfDice: option.numberOfDice, diceType: option.diceType }];
  }
  return [];
}

function diceLabel(
  option: AttackModifierOption,
  damageDice: DamageRollDice[]
): string {
  const damageText = option.damageText.trim();
  if (damageDice.length <= 1) {
    if (damageText.length > 0) return damageText;
    const only = damageDice[0];
    return only ? `${only.numberOfDice}d${only.diceType}` : "";
  }

  const extra = damageDice
    .slice(1)
    .map((die) => `${die.numberOfDice}d${die.diceType}`)
    .join(" + ");
  if (damageText.length > 0) return `${damageText} + ${extra}`;
  return damageDice
    .map((die) => `${die.numberOfDice}d${die.diceType}`)
    .join(" + ");
}

function toDamageRollOption(
  attackMode: DamageRollAttackMode,
  option: AttackModifierOption
): DamageRollWeaponOption {
  const damageDice = damageDiceFor(option);
  const displayName = option.weaponName;
  const dice = diceLabel(option, damageDice);
  return {
    attackMode,
    displayName,
    label: `${displayName} — ${ATTACK_MODE_LABEL[attackMode]} — ${dice}`,
    damageDice,
    extraDiceType: option.diceType,
  };
}

/**
 * Damage-roll weapon options in sheet order: melee, range, throw, then a GRID
 * attack only when that attack already has at least one damage die.
 */
export function getDamageRollWeaponOptions(
  character: CharacterDetail
): DamageRollWeaponOption[] {
  const attacks = getAttackModifierArrays(character);
  const options = [
    ...attacks.melee.map((option) => toDamageRollOption("melee", option)),
    ...attacks.range.map((option) => toDamageRollOption("range", option)),
    ...attacks.throw.map((option) => toDamageRollOption("throw", option)),
  ];

  const grid = getGridAttackModifierOptions(character)[0];
  if (!grid) return options;

  const gridOption = toDamageRollOption("grid", grid);
  const gridDice = gridOption.damageDice.reduce(
    (total, die) => total + die.numberOfDice,
    0
  );
  if (gridDice < 1) return options;

  return [...options, gridOption];
}
