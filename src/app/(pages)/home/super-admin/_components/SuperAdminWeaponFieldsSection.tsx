"use client";

import { Checkbox } from "@/app/components/shared/Checkbox";
import { NumberInput } from "@/app/components/shared/NumberInput";
import {
  ATTACK_ROLL_TYPES,
  DAMAGE_TYPES,
} from "@/app/lib/constants/itemCatalogue";
import type {
  Control,
  FieldValues,
  Path,
  UseFormGetValues,
  UseFormSetValue,
} from "react-hook-form";
import { useWatch } from "react-hook-form";

export type WeaponAttackRollChoice = "MELEE" | "RANGE" | "GRID" | "THROW";

/** Weapon-related slice of the super-admin create-item form (structural typing). */
export type SuperAdminWeaponFormSlice = FieldValues & {
  attackRoll: WeaponAttackRollChoice[];
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
};

type SuperAdminWeaponFieldsSectionProps<T extends SuperAdminWeaponFormSlice> = {
  control: Control<T>;
  setValue: UseFormSetValue<T>;
  getValues: UseFormGetValues<T>;
  disabled: boolean;
};

export function SuperAdminWeaponFieldsSection<
  T extends SuperAdminWeaponFormSlice,
>({
  control,
  setValue,
  getValues,
  disabled,
}: SuperAdminWeaponFieldsSectionProps<T>) {
  const attackRollField = "attackRoll" as Path<T>;
  const damageTypesField = "damageTypes" as Path<T>;

  const watchedRolls = useWatch({ control, name: attackRollField });
  const rolls: WeaponAttackRollChoice[] =
    Array.isArray(watchedRolls) && watchedRolls.length > 0
      ? (watchedRolls as WeaponAttackRollChoice[])
      : ["MELEE"];

  const toggleAttackRoll = (value: WeaponAttackRollChoice) => {
    const raw = getValues(attackRollField);
    const cur: WeaponAttackRollChoice[] = Array.isArray(raw)
      ? (raw as WeaponAttackRollChoice[])
      : [];
    if (cur.includes(value)) {
      if (cur.length <= 1) return;
      setValue(attackRollField, cur.filter((x) => x !== value) as never, {
        shouldValidate: true,
      });
    } else {
      setValue(attackRollField, [...cur, value] as never, {
        shouldValidate: true,
      });
    }
  };

  const toggleDamageType = (d: string) => {
    const raw = getValues(damageTypesField);
    const cur: string[] = Array.isArray(raw) ? (raw as string[]) : [];
    if (cur.includes(d)) {
      if (cur.length <= 1) return;
      setValue(damageTypesField, cur.filter((x) => x !== d) as never, {
        shouldValidate: true,
      });
    } else {
      setValue(damageTypesField, [...cur, d] as never, {
        shouldValidate: true,
      });
    }
  };

  const watchedDamageTypes = useWatch({ control, name: damageTypesField });
  const damageTypes: string[] = Array.isArray(watchedDamageTypes)
    ? (watchedDamageTypes as string[])
    : [];

  return (
    <div className="mb-6 rounded-md border border-black/15 bg-paleBlue/25 p-4">
      <h2 className="mb-3 text-sm font-bold text-black">Weapon combat</h2>

      <div className="mb-4">
        <p className="mb-2 text-sm font-bold text-black">Attack roll types</p>
        <p className="mb-2 text-xs text-black/70">
          Select all modes this weapon supports. At least one is required.
        </p>
        <div className="flex flex-wrap gap-3">
          {ATTACK_ROLL_TYPES.map((t) => (
            <Checkbox
              key={t.value}
              checked={rolls.includes(t.value as WeaponAttackRollChoice)}
              onChange={() =>
                toggleAttackRoll(t.value as WeaponAttackRollChoice)
              }
              disabled={disabled}
              label={t.label}
            />
          ))}
        </div>
      </div>

      {rolls.includes("MELEE") ? (
        <div className="mb-4 grid gap-4 sm:grid-cols-2 [&>div]:mb-0">
          <NumberInput
            name="attackMeleeBonus"
            label="Melee attack bonus (optional)"
            allowEmpty
            className="mb-0"
            disabled={disabled}
          />
          <NumberInput
            name="defenceMeleeBonus"
            label="Defence vs melee (optional)"
            allowEmpty
            className="mb-0"
            disabled={disabled}
          />
        </div>
      ) : null}

      {rolls.includes("RANGE") ? (
        <div className="mb-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 [&>div]:mb-0">
            <NumberInput
              name="attackRangeBonus"
              label="Range attack bonus (optional)"
              allowEmpty
              className="mb-0"
              disabled={disabled}
            />
            <NumberInput
              name="defenceRangeBonus"
              label="Defence vs range (optional)"
              allowEmpty
              className="mb-0"
              disabled={disabled}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 [&>div]:mb-0">
            <NumberInput
              name="effectiveRange"
              label="Effective range (optional)"
              min={0}
              allowEmpty
              placeholder="Distance units"
              className="mb-0"
              disabled={disabled}
            />
            <NumberInput
              name="maxRange"
              label="Max range (optional)"
              min={0}
              allowEmpty
              placeholder="Distance units"
              className="mb-0"
              disabled={disabled}
            />
          </div>
        </div>
      ) : null}

      {rolls.includes("THROW") ? (
        <div className="mb-4">
          <NumberInput
            name="attackThrowBonus"
            label="Throw attack bonus (optional)"
            allowEmpty
            disabled={disabled}
          />
        </div>
      ) : null}

      {rolls.includes("GRID") ? (
        <div className="mb-4 grid gap-4 sm:grid-cols-2 [&>div]:mb-0">
          <NumberInput
            name="gridAttackBonus"
            label="Grid attack bonus (optional)"
            allowEmpty
            className="mb-0"
            disabled={disabled}
          />
          <NumberInput
            name="gridDefenceBonus"
            label="Grid defence bonus (optional)"
            allowEmpty
            className="mb-0"
            disabled={disabled}
          />
        </div>
      ) : null}

      <div className="mb-4">
        <p className="mb-2 text-sm font-bold text-black">Damage types</p>
        <p className="mb-2 text-xs text-black/70">
          At least one type is required. Dice must be valid integers (e.g. 1d6).
        </p>
        <div className="flex flex-wrap gap-2">
          {DAMAGE_TYPES.map((d) => (
            <Checkbox
              key={d}
              checked={damageTypes.includes(d)}
              onChange={() => toggleDamageType(d)}
              disabled={disabled}
              label={d}
              className="text-xs"
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 [&>div]:mb-0">
        <NumberInput
          name="damageDiceType"
          label="Damage dice type (faces)"
          min={1}
          placeholder="e.g. 6"
          className="mb-0"
          disabled={disabled}
        />
        <NumberInput
          name="damageNumberOfDice"
          label="Number of damage dice"
          min={1}
          placeholder="e.g. 1"
          className="mb-0"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
