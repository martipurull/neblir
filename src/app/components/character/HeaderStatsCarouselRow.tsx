// eslint-disable-next-line no-unused-expressions
"use client";

import type { CharacterDetail } from "@/app/lib/types/character";
import type { DisplayEquipSlot } from "@/app/lib/equipUtils";
import { DISPLAY_SLOTS, getApiSlotsForDisplay } from "@/app/lib/equipUtils";
import type { KeyedMutator } from "swr";
import React, { useMemo, useRef, useState } from "react";
import { EquipItemPickerModal } from "./EquipItemPickerModal";
import { StatCell } from "./StatCell";

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
  const [pickerSlot, setPickerSlot] = useState<DisplayEquipSlot | null>(null);

  const slotValues = useMemo((): Record<DisplayEquipSlot, React.ReactNode> => {
    if (!character?.inventory) {
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
      for (const entry of character.inventory!) {
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

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const width = el.clientWidth;
    const index = Math.round(el.scrollLeft / width);
    setPageIndex(Math.max(0, Math.min(index, 1)));
  };

  const canEquip = !!character && !!mutate;

  return (
    <div className="mt-1.5 w-full max-w-xs overflow-hidden">
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
        <div className="grid min-w-full shrink-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-1.5 overflow-hidden snap-start snap-always [&>*]:min-w-0">
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
