"use client";

import { getCarriedInventory } from "@/app/lib/constants/inventory";
import type { CharacterDetail } from "@/app/lib/types/character";
import type { DisplayEquipSlot } from "@/app/lib/equipUtils";
import { DISPLAY_SLOTS, getApiSlotsForDisplay } from "@/app/lib/equipUtils";
import type { KeyedMutator } from "swr";
import React, { useMemo, useState } from "react";
import { EquipItemPickerModal } from "./EquipItemPickerModal";
import { StatCell } from "./StatCell";

export interface HeaderStatsCarouselRowProps {
  fmt: (n: number) => string;
  character?: CharacterDetail;
  mutate?: KeyedMutator<CharacterDetail | null>;
  /** When false, GRID Atk shows "—" and is not clickable. */
  showGridAttack: boolean;
  /** Display value for GRID Atk when showGridAttack (best mod among options). */
  gridAttackDisplayMod: number;
  /** Dice count shown for GRID Def (Mentality + GRID skill + best carried gridDefenceBonus). */
  gridDefenceDisplayMod: number;
  /** GRID Mod cell: e.g. "+2 / +1" from carried item bonuses. */
  gridModCellValue: React.ReactNode;
  /** When true, GRID Def is greyed out and cannot be rolled. */
  gridDefenceDisabled?: boolean;
  onGridAttack?: () => void;
  onGridDefence?: () => void;
}

export function HeaderStatsCarouselRow({
  fmt,
  character,
  mutate,
  showGridAttack,
  gridAttackDisplayMod,
  gridDefenceDisplayMod,
  gridModCellValue,
  gridDefenceDisabled,
  onGridAttack,
  onGridDefence,
}: HeaderStatsCarouselRowProps) {
  const [pickerSlot, setPickerSlot] = useState<DisplayEquipSlot | null>(null);

  const slotValues = useMemo((): Record<DisplayEquipSlot, React.ReactNode> => {
    const carried = getCarriedInventory(character?.inventory ?? undefined);
    if (!carried.length) {
      return { HAND: "—", FOOT: "—", BODY_HEAD: "—" };
    }
    const values: Record<DisplayEquipSlot, React.ReactNode> = {
      HAND: "—",
      FOOT: "—",
      BODY_HEAD: "—",
    };
    for (const displaySlot of ["HAND", "FOOT", "BODY_HEAD"] as const) {
      const apiSlots = getApiSlotsForDisplay(displaySlot);
      const maxItems = displaySlot === "BODY_HEAD" ? 4 : 2;
      const names: string[] = [];
      for (const entry of carried) {
        const name = entry.customName ?? entry.item?.name ?? "?";
        for (const apiSlot of apiSlots) {
          const count = (entry.equipSlots ?? []).filter(
            (s) => s === apiSlot
          ).length;
          for (let i = 0; i < count && names.length < maxItems; i++) {
            names.push(name);
          }
        }
      }
      if (names.length === 0) {
        values[displaySlot] = "—";
      } else {
        const maxLen = Math.max(...names.map((n) => n.length));
        const textSize =
          maxLen > 14 || names.length > 3
            ? "text-[9px]"
            : maxLen > 8 || names.length > 1
              ? "text-[10px]"
              : "text-xs";
        values[displaySlot] = (
          <div className="flex min-w-0 w-full max-w-full flex-col items-center gap-0 overflow-hidden">
            {names.map((name, i) => (
              <span
                key={i}
                className={`block w-full min-w-0 truncate text-center ${textSize}`}
                title={name}
              >
                {name}
              </span>
            ))}
          </div>
        );
      }
    }
    return values;
  }, [character?.inventory]);

  const canEquip = !!character && !!mutate;

  return (
    <div className="mt-1.5 w-full min-w-0">
      <div className="grid w-full min-w-0 grid-cols-3 gap-1.5">
        <StatCell
          label="GRID Atk"
          value={showGridAttack ? fmt(gridAttackDisplayMod) : "—"}
          compact
          onClick={showGridAttack ? onGridAttack : undefined}
        />
        <StatCell
          label="GRID Def"
          value={fmt(gridDefenceDisplayMod)}
          compact
          onClick={gridDefenceDisabled ? undefined : onGridDefence}
          disabled={gridDefenceDisabled}
        />
        <StatCell label="GRID Mods" value={gridModCellValue} compact />
      </div>

      <div className="mt-1.5 grid w-full min-w-0 grid-cols-3 gap-1.5 [&>*]:min-w-0 [&>*]:overflow-hidden">
        {DISPLAY_SLOTS.map(({ slot, label }) => (
          <StatCell
            key={slot}
            label={label}
            value={slotValues[slot]}
            compact
            alignTop
            onClick={canEquip ? () => setPickerSlot(slot) : undefined}
          />
        ))}
      </div>

      {character && mutate && pickerSlot && (
        <EquipItemPickerModal
          isOpen={!!pickerSlot}
          onClose={() => setPickerSlot(null)}
          slot={pickerSlot}
          character={character}
          mutate={mutate}
        />
      )}
    </div>
  );
}
