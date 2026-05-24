import { Checkbox } from "@/app/components/shared/Checkbox";
import { ModalFieldLabel } from "@/app/components/games/shared/ModalFieldLabel";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { ATTACK_ROLL_TYPES, DAMAGE_TYPES } from "./itemModalConstants";

const WEAPON_FIELD_IDS = {
  custom: {
    attackRoll: "custom-item-attack-roll",
    melee: "custom-item-melee-bonus",
    range: "custom-item-range-bonus",
    throw: "custom-item-throw-bonus",
    gridAttack: "custom-item-grid-attack",
    defenceMelee: "custom-item-defence-melee",
    defenceRange: "custom-item-defence-range",
    gridDefence: "custom-item-grid-defence",
    effectiveRange: "custom-item-effective-range",
    maxRange: "custom-item-max-range",
    damageTypes: "custom-item-damage-types",
    diceType: "custom-item-dice-type",
    numberDice: "custom-item-number-dice",
  },
  unique: {
    attackRoll: "unique-attack-roll-override",
    melee: "unique-melee-override",
    range: "unique-range-override",
    throw: "unique-throw-override",
    gridAttack: "unique-grid-attack-override",
    defenceMelee: "unique-def-melee-override",
    defenceRange: "unique-def-range-override",
    gridDefence: "unique-grid-def-override",
    effectiveRange: "unique-effective-range-override",
    maxRange: "unique-max-range-override",
    damageTypes: "unique-damage-types-override",
    diceType: "unique-dice-type-override",
    numberDice: "unique-number-dice-override",
  },
} as const;

export type ItemModalWeaponFieldsProps = {
  disabled: boolean;
  fieldIdPreset: keyof typeof WEAPON_FIELD_IDS;
  attackRollLabel?: string;
  attackRoll: string[];
  onToggleAttackRoll: (value: string) => void;
  attackMeleeBonus: string;
  onAttackMeleeBonusChange: (value: string) => void;
  attackRangeBonus: string;
  onAttackRangeBonusChange: (value: string) => void;
  attackThrowBonus: string;
  onAttackThrowBonusChange: (value: string) => void;
  gridAttackBonus: string;
  onGridAttackBonusChange: (value: string) => void;
  defenceMeleeBonus: string;
  onDefenceMeleeBonusChange: (value: string) => void;
  defenceRangeBonus: string;
  onDefenceRangeBonusChange: (value: string) => void;
  gridDefenceBonus: string;
  onGridDefenceBonusChange: (value: string) => void;
  effectiveRange: string;
  onEffectiveRangeChange: (value: string) => void;
  maxRange: string;
  onMaxRangeChange: (value: string) => void;
  damageTypes: string[];
  onToggleDamageType: (value: string) => void;
  damageDiceType: string;
  onDamageDiceTypeChange: (value: string) => void;
  damageNumberOfDice: string;
  onDamageNumberOfDiceChange: (value: string) => void;
  /** Custom item: one wrapped row. Unique modal: two rows (6 + rest). */
  damageTypesLayout: "single-row" | "two-rows";
  rangePlaceholder?: string;
  damageTypesLabel?: string;
  diceTypeLabel?: string;
  numberOfDiceLabel?: string;
};

export function ItemModalWeaponFields({
  disabled,
  fieldIdPreset,
  attackRollLabel = "Attack roll types",
  attackRoll,
  onToggleAttackRoll,
  attackMeleeBonus,
  onAttackMeleeBonusChange,
  attackRangeBonus,
  onAttackRangeBonusChange,
  attackThrowBonus,
  onAttackThrowBonusChange,
  gridAttackBonus,
  onGridAttackBonusChange,
  defenceMeleeBonus,
  onDefenceMeleeBonusChange,
  defenceRangeBonus,
  onDefenceRangeBonusChange,
  gridDefenceBonus,
  onGridDefenceBonusChange,
  effectiveRange,
  onEffectiveRangeChange,
  maxRange,
  onMaxRangeChange,
  damageTypes,
  onToggleDamageType,
  damageDiceType,
  onDamageDiceTypeChange,
  damageNumberOfDice,
  onDamageNumberOfDiceChange,
  damageTypesLayout,
  rangePlaceholder = "Distance units",
  damageTypesLabel = "Damage types",
  diceTypeLabel = "Dice type",
  numberOfDiceLabel = "Number of dice",
}: ItemModalWeaponFieldsProps) {
  const ids = WEAPON_FIELD_IDS[fieldIdPreset];

  const damageCheckboxes = (types: readonly string[]) =>
    types.map((d) => (
      <Checkbox
        key={d}
        checked={damageTypes.includes(d)}
        onChange={() => onToggleDamageType(d)}
        disabled={disabled}
        tone="inverse"
        label={d}
        className="text-xs"
      />
    ));

  return (
    <div className="space-y-3">
      <div>
        <ModalFieldLabel id={ids.attackRoll} label={attackRollLabel} />
        <div className="flex flex-wrap gap-2">
          {ATTACK_ROLL_TYPES.map((t) => (
            <Checkbox
              key={t.value}
              checked={attackRoll.includes(t.value)}
              onChange={() => onToggleAttackRoll(t.value)}
              disabled={disabled}
              tone="inverse"
              label={t.label}
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ModalNumberField
          id={ids.melee}
          label="Melee bonus"
          value={attackMeleeBonus}
          onChange={onAttackMeleeBonusChange}
          disabled={disabled}
          required={false}
        />
        <ModalNumberField
          id={ids.range}
          label="Range bonus"
          value={attackRangeBonus}
          onChange={onAttackRangeBonusChange}
          disabled={disabled}
          required={false}
        />
        <ModalNumberField
          id={ids.throw}
          label="Throw bonus"
          value={attackThrowBonus}
          onChange={onAttackThrowBonusChange}
          disabled={disabled}
          required={false}
        />
        <ModalNumberField
          id={ids.gridAttack}
          label="Grid attack"
          value={gridAttackBonus}
          onChange={onGridAttackBonusChange}
          disabled={disabled}
          required={false}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ModalNumberField
          id={ids.defenceMelee}
          label="Defence melee"
          value={defenceMeleeBonus}
          onChange={onDefenceMeleeBonusChange}
          disabled={disabled}
          required={false}
        />
        <ModalNumberField
          id={ids.defenceRange}
          label="Defence range"
          value={defenceRangeBonus}
          onChange={onDefenceRangeBonusChange}
          disabled={disabled}
          required={false}
        />
        <ModalNumberField
          id={ids.gridDefence}
          label="Grid defence"
          value={gridDefenceBonus}
          onChange={onGridDefenceBonusChange}
          disabled={disabled}
          required={false}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ModalNumberField
          id={ids.effectiveRange}
          label="Effective range"
          value={effectiveRange}
          onChange={onEffectiveRangeChange}
          disabled={disabled}
          required={false}
          min={0}
          placeholder={rangePlaceholder}
        />
        <ModalNumberField
          id={ids.maxRange}
          label="Max range"
          value={maxRange}
          onChange={onMaxRangeChange}
          disabled={disabled}
          required={false}
          min={0}
          placeholder={rangePlaceholder}
        />
      </div>
      <div>
        <ModalFieldLabel id={ids.damageTypes} label={damageTypesLabel} />
        {damageTypesLayout === "single-row" ? (
          <div className="flex flex-wrap gap-2">
            {damageCheckboxes(DAMAGE_TYPES)}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {damageCheckboxes(DAMAGE_TYPES.slice(0, 6))}
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {damageCheckboxes(DAMAGE_TYPES.slice(6))}
            </div>
          </>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ModalNumberField
          id={ids.diceType}
          label={diceTypeLabel}
          value={damageDiceType}
          onChange={onDamageDiceTypeChange}
          disabled={disabled}
          required={false}
          min={1}
          placeholder="e.g. 6"
        />
        <ModalNumberField
          id={ids.numberDice}
          label={numberOfDiceLabel}
          value={damageNumberOfDice}
          onChange={onDamageNumberOfDiceChange}
          disabled={disabled}
          required={false}
          min={1}
          placeholder="e.g. 2"
        />
      </div>
    </div>
  );
}
