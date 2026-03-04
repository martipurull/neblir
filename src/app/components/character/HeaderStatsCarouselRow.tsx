"use client";

import type { CharacterDetail } from "@/app/lib/types/character";
import React, { useRef, useState } from "react";
import { StatCell } from "./StatCell";

export interface HeaderStatsCarouselRowProps {
  combatInformation: CharacterDetail["combatInformation"];
  fmt: (n: number) => string;
}

export function HeaderStatsCarouselRow({
  combatInformation,
  fmt,
}: HeaderStatsCarouselRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const width = el.clientWidth;
    const index = Math.round(el.scrollLeft / width);
    setPageIndex(Math.max(0, Math.min(index, 1)));
  };

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
          <StatCell label="Hand Equip" value="—" compact />
          <StatCell label="Foot Equip" value="—" compact />
          <StatCell label="Body Equip" value="—" compact />
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
    </div>
  );
}
