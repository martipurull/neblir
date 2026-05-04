"use client";

import { Checkbox } from "@/app/components/shared/Checkbox";
import type { ItemWeaponDamageType } from "@prisma/client";
import { weaponDamageTypeSchema } from "@/app/lib/types/item";

const OPTIONS = weaponDamageTypeSchema.options;

function labelForDamageType(value: string): string {
  return value.replace(/_/g, " ");
}

export type ModalDamageTypeCheckboxGridProps = {
  /** Prefix for stable checkbox ids (e.g. `enemy-immune`). */
  idPrefix: string;
  sectionTitle: string;
  selected: ItemWeaponDamageType[];
  onToggle: (t: ItemWeaponDamageType) => void;
  disabled: boolean;
};

/**
 * Checkboxes for each weapon damage type (same enum as action damage).
 */
export function ModalDamageTypeCheckboxGrid({
  idPrefix,
  sectionTitle,
  selected,
  onToggle,
  disabled,
}: ModalDamageTypeCheckboxGridProps) {
  return (
    <fieldset
      disabled={disabled}
      className="rounded border border-white/15 p-3"
    >
      <legend className="px-1 text-sm font-semibold text-white/90">
        {sectionTitle}
      </legend>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {OPTIONS.map((value) => (
          <Checkbox
            key={`${idPrefix}-${value}`}
            tone="inverse"
            checked={selected.includes(value)}
            onChange={() => onToggle(value)}
            disabled={disabled}
            label={labelForDamageType(value)}
          />
        ))}
      </div>
    </fieldset>
  );
}
