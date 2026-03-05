"use client";

import type { CharacterDetail } from "@/app/lib/types/character";
import type { EquipSlot } from "@/app/lib/types/character";
import type { KeyedMutator } from "swr";
import React, { useMemo, useRef, useState } from "react";
import { EquipItemPickerModal } from "./EquipItemPickerModal";
import { StatCell } from "./StatCell";

const EQUIP_SLOTS: { slot: EquipSlot; label: string }[] = [
  { slot: "HAND", label: "Hand Equip" },
  { slot: "FOOT", label: "Foot Equip" },
  { slot: "BODY", label: "Body Equip" },
];
const MAX_PER_SLOT = 2;

export interface HeaderStatsCarouselRowProps {
  combatInformation: CharacterDetail["combatInformation"];
  fmt: (n: number) => string;
  character?: CharacterDetail;
  mutate?: KeyedMutator<CharacterDetail | null>;
}

export function HeaderStatsCarouselRow({
  combatInformation,
  fmt,
  character,
  mutate,
}: HeaderStatsCarouselRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pickerSlot, setPickerSlot] = useState<EquipSlot | null>(null);

  const slotValues = useMemo(() => {
    if (!character?.inventory) {
      return { HAND: "—", FOOT: "—", BODY: "—" } as const;
    }
    const values: Record<EquipSlot, string> = {
      HAND: "—",
      FOOT: "—",
      BODY: "—",
    };
    for (const slot of ["HAND", "FOOT", "BODY"] as const) {
      const inSlot = character.inventory!.filter((e) => e.equipSlot === slot);
      const names = inSlot
        .slice(0, MAX_PER_SLOT)
        .map((e) => e.customName ?? e.item?.name ?? "?");
      values[slot] = names.length > 0 ? names.join(", ") : "—";
    }
    return values;
  }, [character?.inventory]);

  const slotCounts = useMemo(() => {
    if (!character?.inventory) {
      return { HAND: 0, FOOT: 0, BODY: 0 } as const;
    }
    const counts: Record<EquipSlot, number> = {
      HAND: 0,
      FOOT: 0,
      BODY: 0,
    };
    for (const entry of character.inventory) {
      if (entry.equipSlot && counts[entry.equipSlot] !== undefined) {
        counts[entry.equipSlot]++;
      }
    }
    return counts;
  }, [character?.inventory]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const width = el.clientWidth;
    const index = Math.round(el.scrollLeft / width);
    setPageIndex(Math.max(0, Math.min(index, 1)));
  };

  const canEquip = !!character && !!mutate;

  return (
    <div className="mt-1.5 w-full max-w-xs">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory gap-1.5 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "x mandatory" }}
      >
        <div className="grid min-w-full shrink-0 grid-cols-3 gap-1.5 snap-start snap-always">
          <StatCell
            label="GRID Atk"
            value={fmt(combatInformation.GridAttackMod)}
            compact
          />
          <StatCell
            label="GRID Def"
            value={fmt(combatInformation.GridDefenceMod)}
            compact
          />
          <StatCell
            label="GRID Mod"
            value={fmt(combatInformation.GridMod)}
            compact
          />
        </div>
        <div className="grid min-w-full shrink-0 grid-cols-3 gap-1.5 snap-start snap-always">
          {EQUIP_SLOTS.map(({ slot, label }) => {
            const full = canEquip && slotCounts[slot] >= MAX_PER_SLOT;
            return (
              <StatCell
                key={slot}
                label={label}
                value={slotValues[slot]}
                compact
                onClick={
                  canEquip && !full ? () => setPickerSlot(slot) : undefined
                }
                disabled={canEquip && full}
              />
            );
          })}
        </div>
      </div>
      <div className="mt-1 flex justify-center gap-1" aria-hidden>
        <span
          className={`h-1.5 w-1.5 rounded-full ${pageIndex === 0 ? "bg-black" : "bg-black/30"}`}
        />
        <span
          className={`h-1.5 w-1.5 rounded-full ${pageIndex === 1 ? "bg-black" : "bg-black/30"}`}
        />
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
