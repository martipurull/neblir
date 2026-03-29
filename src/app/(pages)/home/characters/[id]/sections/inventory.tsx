// eslint-disable-next-line no-unused-expressions
"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import type { EquipSlot } from "@/app/lib/types/character";
import { AddItemToInventoryModal } from "@/app/components/character/AddItemToInventoryModal";
import { EquipSlotChoiceModal } from "@/app/components/character/EquipSlotChoiceModal";
import { ItemDetailModal } from "@/app/components/character/ItemDetailModal";
import CreateUniqueItemModal from "@/app/components/games/CreateUniqueItemModal";
import {
  getCarriedInventory,
  ITEM_LOCATION_CARRIED,
} from "@/app/lib/constants/inventory";
import {
  getCarriedWeight,
  getEffectiveMaxCarryWeight,
  isOverCarryLimit,
} from "@/app/lib/carryWeightUtils";
import { getGameById } from "@/lib/api/game";
import { updateCharacterInventoryEntry } from "@/lib/api/items";
import type { KeyedMutator } from "swr";
import React, { useCallback, useEffect, useMemo, useState } from "react";

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
  equippingId,
}: {
  title: string;
  entries: InventoryEntry[];
  variant: "carried" | "stored";
  onSelectDetail: (entry: InventoryEntry) => void;
  onSelectEquip: ((entry: InventoryEntry) => void) | null;
  onUnequip: (entry: InventoryEntry) => void;
  unequippingId: string | null;
  equippingId: string | null;
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
                        disabled={
                          unequippingId === entry.id || equippingId === entry.id
                        }
                        className="w-[4.25rem] overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-black bg-transparent px-1 py-0.5 text-[10px] font-medium text-black transition-colors hover:bg-black/10 disabled:opacity-50"
                      >
                        {unequippingId === entry.id
                          ? "Unequipping…"
                          : "Unequip"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={equippingId === entry.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEquip(entry);
                        }}
                        className="w-[4.25rem] overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-black bg-transparent px-1 py-0.5 text-[10px] font-medium text-black transition-colors hover:bg-black/10 disabled:opacity-50"
                      >
                        {equippingId === entry.id ? "Equipping…" : "Equip"}
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
  const [createUniqueOpen, setCreateUniqueOpen] = useState(false);
  const [detailEntry, setDetailEntry] = useState<
    NonNullable<CharacterDetail["inventory"]>[number] | null
  >(null);
  const [equipEntry, setEquipEntry] = useState<
    NonNullable<CharacterDetail["inventory"]>[number] | null
  >(null);
  const [unequippingId, setUnequippingId] = useState<string | null>(null);
  const [equippingId, setEquippingId] = useState<string | null>(null);

  useEffect(() => {
    if (!detailEntry || !character.inventory?.length) return;
    const updated = character.inventory.find((e) => e.id === detailEntry.id);
    if (updated) setDetailEntry(updated);
  }, [character.inventory, detailEntry]);

  const inventory = useMemo(
    () => character.inventory ?? [],
    [character.inventory]
  );
  const characterGames = useMemo(
    () => Array.from(new Set((character.games ?? []).map((g) => g.gameId))),
    [character.games]
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
    setEquippingId(entry.id);
    try {
      await updateCharacterInventoryEntry(character.id, entry.id, {
        action: "equip",
        slot,
      });
      await mutate();
      setEquipEntry(null);
    } catch {
      setEquipEntry(null);
    } finally {
      setEquippingId(null);
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

  const openCreateUnique = () => {
    setCreateUniqueOpen(true);
  };

  const resolveGiveRecipients = useCallback(
    async (entry: InventoryEntry) => {
      const selfId = character.id;
      const linked = character.games?.map((g) => g.gameId) ?? [];
      let restrictGameId: string | null = null;
      if (entry.sourceType === "CUSTOM_ITEM") {
        const gid = (entry.item as { gameId?: string } | null)?.gameId;
        if (gid) restrictGameId = gid;
      }
      if (entry.sourceType === "UNIQUE_ITEM") {
        const gid = (entry.item as { gameId?: string } | null)?.gameId;
        if (gid) restrictGameId = gid;
      }
      const gameIdSet = new Set(linked);
      if (restrictGameId != null) gameIdSet.add(restrictGameId);
      const gameIds = [...gameIdSet];
      if (gameIds.length === 0) return [];

      const games = await Promise.all(gameIds.map((id) => getGameById(id)));

      const restrictSet =
        restrictGameId != null
          ? new Set(
              (
                games.find((g) => g.id === restrictGameId)?.characters ?? []
              ).map((c) => c.character.id)
            )
          : null;

      const byId = new Map<string, string>();
      for (const game of games) {
        for (const gc of game.characters ?? []) {
          const c = gc.character;
          if (c.id === selfId) continue;
          if (restrictSet != null && !restrictSet.has(c.id)) continue;
          const label =
            [c.name, c.surname ?? ""]
              .filter((s) => String(s).trim())
              .join(" ")
              .trim() || c.id;
          if (!byId.has(c.id)) byId.set(c.id, label);
        }
      }

      return [...byId.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    [character.id, character.games]
  );

  return (
    <div className="space-y-0">
      <div className="mb-2 flex flex-col gap-1.5 pb-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setBrowseModalOpen(true)}
            disabled={!canAddItems}
            className="w-fit rounded border border-black bg-transparent px-2 py-1 text-xs font-medium text-black transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Browse items
          </button>
          <button
            type="button"
            onClick={openCreateUnique}
            disabled={!canAddItems}
            className="w-fit rounded border border-black bg-transparent px-2 py-1 text-xs font-medium text-black transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create unique item
          </button>
        </div>
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
            equippingId={equippingId}
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
            equippingId={equippingId}
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

      {createUniqueOpen && (
        <CreateUniqueItemModal
          isOpen={createUniqueOpen}
          customTemplateGameIds={characterGames}
          noLinkedGameNotice={
            characterGames.length === 0
              ? "Not linked to a game yet — you can still create unique items from the global catalog. Link to a game to also use that game’s custom items as templates."
              : undefined
          }
          submitEndpoint={`/api/characters/${encodeURIComponent(character.id)}/unique-items`}
          onClose={() => {
            setCreateUniqueOpen(false);
          }}
          onSuccess={() => {
            void mutate();
          }}
        />
      )}

      {detailEntry && (
        <ItemDetailModal
          isOpen={!!detailEntry}
          onClose={() => setDetailEntry(null)}
          entry={detailEntry}
          characterId={character.id}
          gameId={character.games?.[0]?.gameId ?? null}
          mutate={mutate}
          resolveGiveRecipients={resolveGiveRecipients}
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
