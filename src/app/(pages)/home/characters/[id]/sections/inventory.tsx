// eslint-disable-next-line no-unused-expressions
"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import type { EquipSlot } from "@/app/lib/types/character";
import { AddItemToInventoryModal } from "@/app/components/character/AddItemToInventoryModal";
import { EquipSlotChoiceModal } from "@/app/components/character/EquipSlotChoiceModal";
import { ItemDetailModal } from "@/app/components/character/ItemDetailModal";
import {
  getCarriedInventory,
  ITEM_LOCATION_CARRIED,
} from "@/app/lib/constants/inventory";
import {
  getCarriedWeight,
  getEffectiveMaxCarryWeight,
  isOverCarryLimit,
} from "@/app/lib/carryWeightUtils";
import { updateCharacterInventoryEntry } from "@/lib/api/items";
import type { KeyedMutator } from "swr";
import React, { useEffect, useMemo, useState } from "react";

type InventoryEntry = NonNullable<CharacterDetail["inventory"]>[number];

const CARRIED_GRID = "grid grid-cols-[minmax(0,1fr)_2.5rem_3rem_4.5rem] gap-3";
const STORED_GRID = "grid grid-cols-[minmax(0,1fr)_2.5rem_3rem_8rem] gap-3";

function InventoryList({
  title,
  entries,
  variant,
  onSelectDetail,
  onSelectEquip,
  onUnequip,
  unequippingId,
}: {
  title: string;
  entries: InventoryEntry[];
  variant: "carried" | "stored";
  onSelectDetail: (entry: InventoryEntry) => void;
  onSelectEquip: ((entry: InventoryEntry) => void) | null;
  onUnequip: (entry: InventoryEntry) => void;
  unequippingId: string | null;
}) {
  if (entries.length === 0) return null;
  const gridClass = variant === "stored" ? STORED_GRID : CARRIED_GRID;
  const lastColumnLabel = variant === "stored" ? "Location" : "Equip";
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200 pb-1 mt-2 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-paleBlue">
          {title}
        </h3>
      </div>
      <div
        className={`${gridClass} mt-2 border-b border-black pb-2 text-xs font-medium uppercase tracking-widest text-black`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="h-3 w-px shrink-0 bg-black" aria-hidden />
          Item
        </span>
        <span className="text-right">Qty</span>
        <span className="text-right">Weight</span>
        <span className="text-right">{lastColumnLabel}</span>
      </div>
      <ul className="divide-y divide-black">
        {entries.map((entry) => {
          const name = entry.customName ?? entry.item?.name ?? "Unknown item";
          const weight = entry.item?.weight;
          const equippable = entry.item?.equippable === true;
          const showEquip =
            variant === "carried" && onSelectEquip != null && equippable;
          const location =
            variant === "stored" && entry.itemLocation?.trim()
              ? entry.itemLocation.trim()
              : null;
          return (
            <li key={entry.id} className={`${gridClass} items-start py-2.5`}>
              <button
                type="button"
                onClick={() => onSelectDetail(entry)}
                className="min-w-0 cursor-pointer text-left hover:opacity-80"
              >
                <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0">
                  <span className="break-words text-sm text-black">{name}</span>
                  {(entry.equipSlots?.length ?? 0) > 0 && (
                    <span className="shrink-0 text-xs text-black">
                      (
                      {entry.equipSlots!.map((s) => s.toLowerCase()).join(", ")}
                      )
                    </span>
                  )}
                </div>
              </button>
              <span className="text-right text-sm tabular-nums text-black">
                {entry.quantity ?? 1}
              </span>
              <span className="text-right text-sm tabular-nums text-black">
                {weight != null ? `${weight}kg` : "—"}
              </span>
              {variant === "stored" ? (
                <span
                  className="min-w-0 truncate text-right text-sm text-black"
                  title={location ?? undefined}
                >
                  {location ?? "—"}
                </span>
              ) : (
                <div className="flex justify-end">
                  {showEquip ? (
                    (entry.equipSlots?.length ?? 0) > 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void onUnequip(entry);
                        }}
                        disabled={unequippingId === entry.id}
                        className="rounded-full border border-black bg-transparent px-2 py-0.5 text-xs font-medium text-black transition-colors hover:bg-black/10 disabled:opacity-50"
                      >
                        {unequippingId === entry.id
                          ? "Unequipping…"
                          : "Unequip"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEquip(entry);
                        }}
                        className="rounded-full border border-black bg-transparent px-2 py-0.5 text-xs font-medium text-black transition-colors hover:bg-black/10"
                      >
                        Equip
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-black/50">—</span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface InventorySectionContentProps {
  character: CharacterDetail;
  mutate: KeyedMutator<CharacterDetail | null>;
  /** When false, user cannot add items (e.g. over 150% carry weight) */
  canAddItems?: boolean;
}

function InventorySectionContent({
  character,
  mutate,
  canAddItems = true,
}: InventorySectionContentProps) {
  const [browseModalOpen, setBrowseModalOpen] = useState(false);
  const [detailEntry, setDetailEntry] = useState<
    NonNullable<CharacterDetail["inventory"]>[number] | null
  >(null);
  const [equipEntry, setEquipEntry] = useState<
    NonNullable<CharacterDetail["inventory"]>[number] | null
  >(null);
  const [unequippingId, setUnequippingId] = useState<string | null>(null);

  useEffect(() => {
    if (!detailEntry || !character.inventory?.length) return;
    const updated = character.inventory.find((e) => e.id === detailEntry.id);
    if (updated) setDetailEntry(updated);
  }, [character.inventory, detailEntry]);

  const inventory = useMemo(
    () => character.inventory ?? [],
    [character.inventory]
  );
  const carriedInventory = useMemo(
    () => getCarriedInventory(inventory),
    [inventory]
  );
  const storedInventory = useMemo(
    () =>
      inventory.filter(
        (e) =>
          e.itemLocation !== undefined &&
          e.itemLocation !== null &&
          e.itemLocation !== ITEM_LOCATION_CARRIED
      ),
    [inventory]
  );

  const handleEquipSelect = async (
    entry: NonNullable<CharacterDetail["inventory"]>[number],
    slot: EquipSlot
  ) => {
    try {
      await updateCharacterInventoryEntry(character.id, entry.id, {
        action: "equip",
        slot,
      });
      await mutate();
      setEquipEntry(null);
    } catch {
      setEquipEntry(null);
    }
  };

  const handleUnequip = async (
    entry: NonNullable<CharacterDetail["inventory"]>[number]
  ) => {
    if (!entry.equipSlots?.length) return;
    setUnequippingId(entry.id);
    try {
      await updateCharacterInventoryEntry(character.id, entry.id, {
        action: "unequipAll",
      });
      await mutate();
    } finally {
      setUnequippingId(null);
    }
  };

  return (
    <div className="space-y-0">
      <div className="mb-2 flex flex-col gap-1.5 pb-2">
        <button
          type="button"
          onClick={() => setBrowseModalOpen(true)}
          disabled={!canAddItems}
          className="w-fit rounded border border-black bg-transparent px-2 py-1 text-xs font-medium text-black transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Browse items
        </button>
        {!canAddItems && (
          <p className="text-xs text-neblirDanger-600">
            At 150%+ carry weight you cannot add items. Store some first.
          </p>
        )}
      </div>
      {inventory.length === 0 ? (
        <p className="py-4 text-center text-sm text-black">No items</p>
      ) : (
        <>
          <InventoryList
            title="On hand"
            variant="carried"
            entries={carriedInventory}
            onSelectDetail={setDetailEntry}
            onSelectEquip={setEquipEntry}
            onUnequip={(entry) => {
              void handleUnequip(entry);
            }}
            unequippingId={unequippingId}
          />
          <InventoryList
            title="Stored"
            variant="stored"
            entries={storedInventory}
            onSelectDetail={setDetailEntry}
            onSelectEquip={null}
            onUnequip={(entry) => {
              void handleUnequip(entry);
            }}
            unequippingId={unequippingId}
          />
        </>
      )}

      {browseModalOpen && (
        <AddItemToInventoryModal
          isOpen={browseModalOpen}
          onClose={() => setBrowseModalOpen(false)}
          character={character}
          mutate={mutate}
        />
      )}

      {detailEntry && (
        <ItemDetailModal
          isOpen={!!detailEntry}
          onClose={() => setDetailEntry(null)}
          entry={detailEntry}
          characterId={character.id}
          mutate={mutate}
        />
      )}

      {equipEntry && (
        <EquipSlotChoiceModal
          isOpen={!!equipEntry}
          onClose={() => setEquipEntry(null)}
          entry={equipEntry}
          inventory={carriedInventory}
          onSelect={(slot) => {
            void handleEquipSelect(equipEntry, slot);
          }}
        />
      )}
    </div>
  );
}

const CARRY_WEIGHT_TOOLTIP = (
  <span className="block text-left text-xs font-normal normal-case text-white">
    <strong className="block mb-1.5">Weight & Speed</strong>
    <span className="block space-y-1">
      <span className="block">≤50% = normal speed</span>
      <span className="block">51–75% = −1 speed</span>
      <span className="block">76–100% = −2 speed</span>
      <span className="block">100–150% = half speed</span>
      <span className="block">
        &gt;150% = 0 speed (cannot move and cannot add items until you store
        some)
      </span>
    </span>
    <strong className="block mt-2 mb-1.5">Armour speed penalty</strong>
    <span className="block space-y-1">
      <span className="block">Grade 2–3: −1 speed</span>
      <span className="block">Grade 4: −2 speed</span>
      <span className="block">Grade 5: −3 speed</span>
    </span>
  </span>
);

export function getInventorySection(
  character: CharacterDetail,
  mutate: KeyedMutator<CharacterDetail | null>
): CharacterSectionSlide {
  const inventory = character.inventory ?? [];
  const totalInventoryWeight = getCarriedWeight(inventory);
  const maxCarryWeight = getEffectiveMaxCarryWeight(
    character.combatInformation?.maxCarryWeight,
    inventory
  );
  const overCarryLimit = isOverCarryLimit(totalInventoryWeight, maxCarryWeight);
  const ratio =
    maxCarryWeight != null && maxCarryWeight > 0
      ? totalInventoryWeight / maxCarryWeight
      : 0;

  const titleSupplement =
    maxCarryWeight != null ? (
      <span className="group relative inline-block">
        <span
          className={
            overCarryLimit
              ? "rounded border border-neblirDanger-200 bg-transparent px-2 py-0.5 text-sm tabular-nums text-neblirDanger-400"
              : ratio > 1
                ? "rounded border border-neblirDanger-200 bg-transparent px-2 py-0.5 text-sm tabular-nums text-neblirDanger-400"
                : ratio >= 0.5
                  ? "rounded border border-neblirWarning-200 bg-transparent px-2 py-0.5 text-sm tabular-nums text-neblirWarning-400"
                  : "rounded border border-neblirSafe-200 bg-transparent px-2 py-0.5 text-sm tabular-nums text-neblirSafe-400"
          }
        >
          {totalInventoryWeight} / {maxCarryWeight} kg
        </span>
        <span
          className="pointer-events-none absolute top-full right-0 z-10 mt-1 hidden max-h-[40vh] w-72 overflow-y-auto rounded border border-white/30 bg-modalBackground-200 px-2.5 py-2 shadow-lg group-hover:block"
          role="tooltip"
        >
          {CARRY_WEIGHT_TOOLTIP}
        </span>
      </span>
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
      <InventorySectionContent
        character={character}
        mutate={mutate}
        canAddItems={!overCarryLimit}
      />
    ),
  };
}
