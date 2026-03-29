"use client";

import React from "react";
import { DetailField } from "./DetailField";
import type { ResolvedItemNonNull } from "./types";
import { EXTRA_WEAPON_COMBAT_FIELDS } from "./weaponDerived";
import { fmtSignedBonus } from "./utils";

type ItemDetailExtraWeaponGridProps = {
  item: ResolvedItemNonNull;
};

export function ItemDetailExtraWeaponGrid({
  item,
}: ItemDetailExtraWeaponGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {EXTRA_WEAPON_COMBAT_FIELDS.map(({ key, label }) => {
        const value = item[key];
        if (value == null) return null;
        return (
          <DetailField key={key} label={label}>
            {fmtSignedBonus(value)}
          </DetailField>
        );
      })}
    </div>
  );
}
