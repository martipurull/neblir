"use client";

import { Checkbox } from "@/app/components/shared/Checkbox";
import {
  ATTACK_ROLL_TYPES,
  DAMAGE_TYPES,
} from "@/app/components/games/shared/itemModalConstants";
import type {
  Control,
  FieldValues,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { useWatch } from "react-hook-form";
import { SuperAdminLabeledField } from "./superAdminFormPrimitives";

export type WeaponAttackRollChoice = "MELEE" | "RANGE" | "GRID" | "THROW";

/** Weapon-related slice of the super-admin create-item form (structural typing). */
export type SuperAdminWeaponFormSlice = FieldValues & {
  attackRoll: WeaponAttackRollChoice[];
  attackMeleeBonus: string;
  attackRangeBonus: string;
  attackThrowBonus: string;
  defenceMeleeBonus: string;
  defenceRangeBonus: string;
  gridAttackBonus: string;
  gridDefenceBonus: string;
  effectiveRange: string;
  maxRange: string;
  damageTypes: string[];
  damageDiceType: string;
  damageNumberOfDice: string;
};

type SuperAdminWeaponFieldsSectionProps<T extends SuperAdminWeaponFormSlice> = {
  control: Control<T>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  getValues: UseFormGetValues<T>;
  disabled: boolean;
};

export function SuperAdminWeaponFieldsSection<
  T extends SuperAdminWeaponFormSlice,
>({
  control,
  register,
  setValue,
  getValues,
  disabled,
}: SuperAdminWeaponFieldsSectionProps<T>) {
  const watchedRolls = useWatch({ control, name: "attackRoll" as never }) as
    | WeaponAttackRollChoice[]
    | undefined;
  const rolls: WeaponAttackRollChoice[] =
    Array.isArray(watchedRolls) && watchedRolls.length > 0
      ? watchedRolls
      : ["MELEE"];

  const toggleAttackRoll = (value: WeaponAttackRollChoice) => {
    const cur = (getValues("attackRoll" as never) ??
      []) as WeaponAttackRollChoice[];
    if (cur.includes(value)) {
      if (cur.length <= 1) return;
      setValue("attackRoll" as never, cur.filter((x) => x !== value) as never, {
        shouldValidate: true,
      });
    } else {
      setValue("attackRoll" as never, [...cur, value] as never, {
        shouldValidate: true,
      });
    }
  };

  const toggleDamageType = (d: string) => {
    const cur = (getValues("damageTypes" as never) ?? []) as string[];
    if (cur.includes(d)) {
      if (cur.length <= 1) return;
      setValue("damageTypes" as never, cur.filter((x) => x !== d) as never, {
        shouldValidate: true,
      });
    } else {
      setValue("damageTypes" as never, [...cur, d] as never, {
        shouldValidate: true,
      });
    }
  };

  const damageTypes =
    (useWatch({ control, name: "damageTypes" as never }) as
      | string[]
      | undefined) ?? [];

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
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <SuperAdminLabeledField
            id="weapon-melee-bonus"
            label="Melee attack bonus (optional)"
            register={register}
            name={"attackMeleeBonus" as never}
            type="number"
          />
          <SuperAdminLabeledField
            id="weapon-def-melee"
            label="Defence vs melee (optional)"
            register={register}
            name={"defenceMeleeBonus" as never}
            type="number"
          />
        </div>
      ) : null}

      {rolls.includes("RANGE") ? (
        <div className="mb-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SuperAdminLabeledField
              id="weapon-range-bonus"
              label="Range attack bonus (optional)"
              register={register}
              name={"attackRangeBonus" as never}
              type="number"
            />
            <SuperAdminLabeledField
              id="weapon-def-range"
              label="Defence vs range (optional)"
              register={register}
              name={"defenceRangeBonus" as never}
              type="number"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SuperAdminLabeledField
              id="weapon-effective-range"
              label="Effective range (optional)"
              register={register}
              name={"effectiveRange" as never}
              type="number"
              min={0}
              placeholder="Distance units"
            />
            <SuperAdminLabeledField
              id="weapon-max-range"
              label="Max range (optional)"
              register={register}
              name={"maxRange" as never}
              type="number"
              min={0}
              placeholder="Distance units"
            />
          </div>
        </div>
      ) : null}

      {rolls.includes("THROW") ? (
        <div className="mb-4">
          <SuperAdminLabeledField
            id="weapon-throw-bonus"
            label="Throw attack bonus (optional)"
            register={register}
            name={"attackThrowBonus" as never}
            type="number"
          />
        </div>
      ) : null}

      {rolls.includes("GRID") ? (
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <SuperAdminLabeledField
            id="weapon-grid-attack"
            label="Grid attack bonus (optional)"
            register={register}
            name={"gridAttackBonus" as never}
            type="number"
          />
          <SuperAdminLabeledField
            id="weapon-grid-defence"
            label="Grid defence bonus (optional)"
            register={register}
            name={"gridDefenceBonus" as never}
            type="number"
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

      <div className="grid gap-4 sm:grid-cols-2">
        <SuperAdminLabeledField
          id="weapon-dice-type"
          label="Damage dice type (faces)"
          register={register}
          name={"damageDiceType" as never}
          type="number"
          min={1}
          placeholder="e.g. 6"
        />
        <SuperAdminLabeledField
          id="weapon-num-dice"
          label="Number of damage dice"
          register={register}
          name={"damageNumberOfDice" as never}
          type="number"
          min={1}
          placeholder="e.g. 1"
        />
      </div>
    </div>
  );
}
