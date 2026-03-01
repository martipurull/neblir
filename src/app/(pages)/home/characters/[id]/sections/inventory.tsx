"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import React from "react";

export function getInventorySection(
  character: CharacterDetail
): CharacterSectionSlide {
  const inventory = character.inventory ?? [];
  const totalInventoryWeight = inventory.reduce(
    (sum, entry) => sum + (entry.item?.weight ?? 0) * (entry.quantity ?? 1),
    0
  );
  const maxCarryWeight = character.combatInformation?.maxCarryWeight;

  const titleSupplement =
    maxCarryWeight != null ? (
      (() => {
        const ratio = totalInventoryWeight / maxCarryWeight;
        const className =
          ratio > 1
            ? "rounded border border-neblirDanger-200 bg-transparent px-2 py-0.5 text-sm tabular-nums text-neblirDanger-400"
            : ratio >= 0.5
              ? "rounded border border-neblirWarning-200 bg-transparent px-2 py-0.5 text-sm tabular-nums text-neblirWarning-400"
              : "rounded border border-neblirSafe-200 bg-transparent px-2 py-0.5 text-sm tabular-nums text-neblirSafe-400";
        return (
          <span className={className}>
            {totalInventoryWeight} / {maxCarryWeight} kg
          </span>
        );
      })()
    ) : totalInventoryWeight > 0 ? (
      <span className="rounded border border-black bg-transparent px-2 py-0.5 text-sm tabular-nums text-black">
        {totalInventoryWeight} kg
      </span>
    ) : undefined;

  return {
    id: "inventory",
    title: "Inventory",
    titleSupplement,
    children: (
      <div className="space-y-0">
        {inventory.length === 0 ? (
          <p className="py-4 text-center text-sm text-black">No items</p>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_2.5rem_3rem] gap-3 border-b border-black pb-2 text-xs font-medium uppercase tracking-widest text-black">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-3 w-px shrink-0 bg-black" aria-hidden />
                Item
              </span>
              <span className="text-right">Qty</span>
              <span className="text-right">Weight</span>
            </div>
            <ul className="divide-y divide-black">
              {inventory.map((entry) => {
                const name =
                  entry.customName ?? entry.item?.name ?? "Unknown item";
                const description = entry.item?.description ?? null;
                const weight = entry.item?.weight;
                return (
                  <li
                    key={entry.id}
                    className="grid grid-cols-[1fr_2.5rem_3rem] gap-3 py-2.5 items-start"
                  >
                    <div className="min-w-0 overflow-x-auto">
                      <div className="flex items-baseline gap-1">
                        <span className="shrink-0 text-sm text-black whitespace-nowrap">
                          {name}
                        </span>
                        {entry.isEquipped && (
                          <span className="shrink-0 text-xs text-black">
                            (equipped)
                          </span>
                        )}
                      </div>
                      {description && (
                        <div
                          className="mt-0.5 max-h-[3.75rem] overflow-y-auto text-xs leading-relaxed text-black"
                          style={{ scrollbarWidth: "thin" }}
                        >
                          {description}
                        </div>
                      )}
                    </div>
                    <span className="text-right text-sm tabular-nums text-black">
                      {entry.quantity ?? 1}
                    </span>
                    <span className="text-right text-sm tabular-nums text-black">
                      {weight != null ? `${weight}kg` : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    ),
  };
}
