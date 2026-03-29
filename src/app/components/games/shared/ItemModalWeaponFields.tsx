import { Checkbox } from "@/app/components/shared/Checkbox";
import { ModalFieldLabel } from "@/app/components/games/shared/ModalFieldLabel";
import { modalInputClass } from "@/app/components/games/shared/modalStyles";
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
        <div>
          <ModalFieldLabel id={ids.melee} label="Melee bonus" />
          <input
            id={ids.melee}
            type="number"
            value={attackMeleeBonus}
            onChange={(e) => onAttackMeleeBonusChange(e.target.value)}
            className={modalInputClass}
            disabled={disabled}
          />
        </div>
        <div>
          <ModalFieldLabel id={ids.range} label="Range bonus" />
          <input
            id={ids.range}
            type="number"
            value={attackRangeBonus}
            onChange={(e) => onAttackRangeBonusChange(e.target.value)}
            className={modalInputClass}
            disabled={disabled}
          />
        </div>
        <div>
          <ModalFieldLabel id={ids.throw} label="Throw bonus" />
          <input
            id={ids.throw}
            type="number"
            value={attackThrowBonus}
            onChange={(e) => onAttackThrowBonusChange(e.target.value)}
            className={modalInputClass}
            disabled={disabled}
          />
        </div>
        <div>
          <ModalFieldLabel id={ids.gridAttack} label="Grid attack" />
          <input
            id={ids.gridAttack}
            type="number"
            value={gridAttackBonus}
            onChange={(e) => onGridAttackBonusChange(e.target.value)}
            className={modalInputClass}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <ModalFieldLabel id={ids.defenceMelee} label="Defence melee" />
          <input
            id={ids.defenceMelee}
            type="number"
            value={defenceMeleeBonus}
            onChange={(e) => onDefenceMeleeBonusChange(e.target.value)}
            className={modalInputClass}
            disabled={disabled}
          />
        </div>
        <div>
          <ModalFieldLabel id={ids.defenceRange} label="Defence range" />
          <input
            id={ids.defenceRange}
            type="number"
            value={defenceRangeBonus}
            onChange={(e) => onDefenceRangeBonusChange(e.target.value)}
            className={modalInputClass}
            disabled={disabled}
          />
        </div>
        <div>
          <ModalFieldLabel id={ids.gridDefence} label="Grid defence" />
          <input
            id={ids.gridDefence}
            type="number"
            value={gridDefenceBonus}
            onChange={(e) => onGridDefenceBonusChange(e.target.value)}
            className={modalInputClass}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <ModalFieldLabel id={ids.effectiveRange} label="Effective range" />
          <input
            id={ids.effectiveRange}
            type="number"
            min={0}
            value={effectiveRange}
            onChange={(e) => onEffectiveRangeChange(e.target.value)}
            className={modalInputClass}
            placeholder={rangePlaceholder}
            disabled={disabled}
          />
        </div>
        <div>
          <ModalFieldLabel id={ids.maxRange} label="Max range" />
          <input
            id={ids.maxRange}
            type="number"
            min={0}
            value={maxRange}
            onChange={(e) => onMaxRangeChange(e.target.value)}
            className={modalInputClass}
            placeholder={rangePlaceholder}
            disabled={disabled}
          />
        </div>
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
        <div>
          <ModalFieldLabel id={ids.diceType} label={diceTypeLabel} />
          <input
            id={ids.diceType}
            type="number"
            min={1}
            value={damageDiceType}
            onChange={(e) => onDamageDiceTypeChange(e.target.value)}
            className={modalInputClass}
            placeholder="e.g. 6"
            disabled={disabled}
          />
        </div>
        <div>
          <ModalFieldLabel id={ids.numberDice} label={numberOfDiceLabel} />
          <input
            id={ids.numberDice}
            type="number"
            min={1}
            value={damageNumberOfDice}
            onChange={(e) => onDamageNumberOfDiceChange(e.target.value)}
            className={modalInputClass}
            placeholder="e.g. 2"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
