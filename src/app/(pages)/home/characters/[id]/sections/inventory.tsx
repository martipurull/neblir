"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import { AddItemToInventoryModal } from "@/app/components/character/AddItemToInventoryModal";
import { ItemDetailModal } from "@/app/components/character/ItemDetailModal";
import { Button } from "@/app/components/shared/Button";
import { CreateUniqueItemModal } from "@/app/components/games/CreateUniqueItemModal";
import {
  getCarriedInventory,
  ITEM_LOCATION_CARRIED,
  sortInventoryEntriesAlphabetically,
} from "@/app/lib/constants/inventory";
import {
  formatWeightKgForDisplay,
  getCarriedWeight,
  getCarryWeightInventoryPillClassName,
  getEffectiveMaxCarryWeight,
  getWornGearCarryWeightSavings,
  isOverCarryLimit,
} from "@/app/lib/carryWeightUtils";
import { isGiveItemRecipientInGame } from "@/app/lib/gmUtils";
import {
  isItemInventoryOperational,
  itemStatusEquipColumnDamageLabel,
} from "@/app/lib/types/item";
import { getGameById } from "@/lib/api/game";
import { EquipErrorModal } from "@/app/components/character/EquipErrorModal";
import { patchCharacterInventoryEntryAndMutate } from "@/lib/api/characterInventoryMutate";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import type { KeyedMutator } from "swr";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  readOnly = false,
}: {
  title: string;
  entries: InventoryEntry[];
  variant: "carried" | "stored";
  onSelectDetail: (entry: InventoryEntry) => void;
  onSelectEquip: ((entry: InventoryEntry) => void) | null;
  onUnequip: (entry: InventoryEntry) => void;
  unequippingId: string | null;
  equippingId: string | null;
  readOnly?: boolean;
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
          const operational = isItemInventoryOperational(entry.status);
          const hasEquippedSlots = (entry.equipSlots?.length ?? 0) > 0;
          const showUnequip = variant === "carried" && hasEquippedSlots;
          const showEquipButton =
            variant === "carried" &&
            onSelectEquip != null &&
            equippable &&
            operational &&
            !hasEquippedSlots;
          const location =
            variant === "stored" && entry.itemLocation?.trim()
              ? entry.itemLocation.trim()
              : null;
          return (
            <li key={entry.id} className={`${gridClass} items-start py-2.5`}>
              {readOnly ? (
                <div className="min-w-0 break-words text-sm text-black">
                  <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0">
                    <span>{name}</span>
                    {(entry.equipSlots?.length ?? 0) > 0 && (
                      <span className="shrink-0 text-xs text-black">
                        (
                        {entry
                          .equipSlots!.map((s) => s.toLowerCase())
                          .join(", ")}
                        )
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="lightRowHit"
                  fullWidth={false}
                  onClick={() => onSelectDetail(entry)}
                >
                  <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0">
                    <span className="break-words text-sm text-black">
                      {name}
                    </span>
                    {(entry.equipSlots?.length ?? 0) > 0 && (
                      <span className="shrink-0 text-xs text-black">
                        (
                        {entry
                          .equipSlots!.map((s) => s.toLowerCase())
                          .join(", ")}
                        )
                      </span>
                    )}
                  </div>
                </Button>
              )}
              <span className="text-right text-sm tabular-nums text-black">
                {entry.quantity ?? 1}
              </span>
              <span className="text-right text-sm tabular-nums text-black">
                {weight != null
                  ? `${formatWeightKgForDisplay(weight)} kg`
                  : "—"}
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
                  {readOnly ? (
                    <span className="text-xs text-black/50">—</span>
                  ) : showUnequip ? (
                    <Button
                      type="button"
                      variant="lightPillAction"
                      fullWidth={false}
                      onClick={(e) => {
                        e.stopPropagation();
                        void onUnequip(entry);
                      }}
                      disabled={
                        unequippingId === entry.id || equippingId === entry.id
                      }
                    >
                      {unequippingId === entry.id ? "Unequipping…" : "Unequip"}
                    </Button>
                  ) : showEquipButton ? (
                    <Button
                      type="button"
                      variant="lightPillAction"
                      fullWidth={false}
                      disabled={equippingId === entry.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEquip(entry);
                      }}
                    >
                      {equippingId === entry.id ? "Equipping…" : "Equip"}
                    </Button>
                  ) : equippable && !operational ? (
                    <div className="flex w-full justify-end">
                      <div className="flex flex-col p-1 text-right text-[10px] font-medium leading-tight text-neblirDanger-600">
                        {entry.status === "BEYOND_REPAIR" ? (
                          <>
                            <span>beyond</span>
                            <span>repair</span>
                          </>
                        ) : (
                          <span>
                            {itemStatusEquipColumnDamageLabel(entry.status) ??
                              "—"}
                          </span>
                        )}
                      </div>
                    </div>
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
  mutate?: KeyedMutator<CharacterDetail | null>;
  activeGameId: string | null;
  readOnly?: boolean;
}

function InventorySectionContent({
  character,
  mutate,
  activeGameId,
  readOnly = false,
}: InventorySectionContentProps) {
  const [browseModalOpen, setBrowseModalOpen] = useState(false);
  const [createUniqueOpen, setCreateUniqueOpen] = useState(false);
  const [detailEntry, setDetailEntry] = useState<
    NonNullable<CharacterDetail["inventory"]>[number] | null
  >(null);
  const [unequippingId, setUnequippingId] = useState<string | null>(null);
  const [equippingId, setEquippingId] = useState<string | null>(null);
  const [equipError, setEquipError] = useState<string | null>(null);

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
    () => sortInventoryEntriesAlphabetically(getCarriedInventory(inventory)),
    [inventory]
  );
  const storedInventory = useMemo(
    () =>
      sortInventoryEntriesAlphabetically(
        inventory.filter(
          (e) =>
            e.itemLocation !== undefined &&
            e.itemLocation !== null &&
            e.itemLocation !== ITEM_LOCATION_CARRIED
        )
      ),
    [inventory]
  );

  const canAddItems = useMemo(() => {
    const carriedWeight = getCarriedWeight(inventory);
    const maxCarryWeight = getEffectiveMaxCarryWeight(
      character.combatInformation?.maxCarryWeight,
      inventory
    );
    return !isOverCarryLimit(carriedWeight, maxCarryWeight);
  }, [character.combatInformation?.maxCarryWeight, inventory]);

  const handleAutoEquip = async (
    entry: NonNullable<CharacterDetail["inventory"]>[number]
  ) => {
    if (!mutate) return;
    setEquippingId(entry.id);
    setEquipError(null);
    try {
      await patchCharacterInventoryEntryAndMutate(
        mutate,
        character.id,
        entry.id,
        { action: "equip" }
      );
    } catch (e) {
      setEquipError(
        getUserSafeErrorMessage(e, "Could not equip this item. Try again.")
      );
    } finally {
      setEquippingId(null);
    }
  };

  const handleUnequip = async (
    entry: NonNullable<CharacterDetail["inventory"]>[number]
  ) => {
    if (!entry.equipSlots?.length || !mutate) return;
    setUnequippingId(entry.id);
    try {
      await patchCharacterInventoryEntryAndMutate(
        mutate,
        character.id,
        entry.id,
        { action: "unequipAll" }
      );
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
        if (!game) continue;
        for (const gc of game.characters ?? []) {
          const c = gc.character;
          if (!isGiveItemRecipientInGame(gc, game, selfId)) continue;
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
      {!readOnly && (
        <div className="mb-2 flex flex-col gap-1.5 pb-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="lightToolbarCompact"
              fullWidth={false}
              onClick={() => setBrowseModalOpen(true)}
              disabled={!canAddItems}
            >
              Browse items
            </Button>
            <Button
              type="button"
              variant="lightToolbarCompact"
              fullWidth={false}
              onClick={openCreateUnique}
              disabled={!canAddItems}
            >
              Create unique item
            </Button>
          </div>
          {!canAddItems && (
            <p className="text-xs text-neblirDanger-600">
              At 150%+ carry weight you cannot add items. Store some first.
            </p>
          )}
        </div>
      )}
      {inventory.length === 0 ? (
        <p className="py-4 text-center text-sm text-black">No items</p>
      ) : (
        <>
          <InventoryList
            title="On hand"
            variant="carried"
            entries={carriedInventory}
            onSelectDetail={setDetailEntry}
            onSelectEquip={
              readOnly
                ? null
                : (e) => {
                    void handleAutoEquip(e);
                  }
            }
            onUnequip={(entry) => {
              void handleUnequip(entry);
            }}
            unequippingId={unequippingId}
            equippingId={equippingId}
            readOnly={readOnly}
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
            readOnly={readOnly}
          />
        </>
      )}

      {browseModalOpen && !readOnly && mutate && (
        <AddItemToInventoryModal
          isOpen={browseModalOpen}
          onClose={() => setBrowseModalOpen(false)}
          character={character}
          mutate={mutate}
        />
      )}

      {createUniqueOpen && !readOnly && mutate && (
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

      {detailEntry && !readOnly && mutate && (
        <ItemDetailModal
          isOpen={!!detailEntry}
          onClose={() => setDetailEntry(null)}
          entry={detailEntry}
          characterId={character.id}
          gameId={activeGameId}
          mutate={mutate}
          resolveGiveRecipients={resolveGiveRecipients}
          equipControl={{
            carriedInventory,
            onEquip: handleAutoEquip,
            onUnequip: handleUnequip,
            equippingId,
            unequippingId,
          }}
        />
      )}

      {!readOnly && (
        <EquipErrorModal
          isOpen={equipError != null}
          message={equipError ?? ""}
          onClose={() => setEquipError(null)}
        />
      )}
    </div>
  );
}

const CARRY_WEIGHT_TOOLTIP = (
  <span className="block text-left text-xs font-normal normal-case text-white">
    <strong className="block mb-1.5">Weight & Speed</strong>
    <span className="block mb-1.5">
      The first number is <strong className="font-semibold">carried</strong>{" "}
      weight; the second is your <strong className="font-semibold">max</strong>{" "}
      (backpacks raise max only). Worn body, head, or foot gear counts at half
      weight toward carried load.
    </span>
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

function InventoryCarryWeightTitleSupplement({
  character,
}: {
  character: CharacterDetail;
}) {
  const inventory = character.inventory ?? [];
  const totalInventoryWeight = getCarriedWeight(inventory);
  const maxCarryWeight = getEffectiveMaxCarryWeight(
    character.combatInformation?.maxCarryWeight,
    inventory
  );
  const wornSavings = getWornGearCarryWeightSavings(inventory);

  if (maxCarryWeight != null) {
    return (
      <span className="group relative inline-block">
        <span
          className={getCarryWeightInventoryPillClassName(
            totalInventoryWeight,
            maxCarryWeight
          )}
          aria-label={`Carried weight ${formatWeightKgForDisplay(totalInventoryWeight)} kilograms of ${formatWeightKgForDisplay(maxCarryWeight)} kilograms maximum`}
        >
          {formatWeightKgForDisplay(totalInventoryWeight)} /{" "}
          {formatWeightKgForDisplay(maxCarryWeight)} kg
        </span>
        <span
          className="pointer-events-none absolute top-full right-0 z-10 mt-1 hidden max-h-[40vh] w-72 overflow-y-auto rounded border border-white/30 bg-modalBackground-200 px-2.5 py-2 shadow-lg group-hover:block"
          role="tooltip"
        >
          {CARRY_WEIGHT_TOOLTIP}
          {wornSavings > 0 ? (
            <span className="mt-2 block text-neblirSafe-400">
              Worn body/head/foot gear is saving{" "}
              {formatWeightKgForDisplay(wornSavings)} kg on your carried load
              right now.
            </span>
          ) : null}
        </span>
      </span>
    );
  }

  if (totalInventoryWeight > 0) {
    return (
      <span className="rounded border border-black bg-transparent px-2 py-0.5 text-sm tabular-nums text-black">
        {formatWeightKgForDisplay(totalInventoryWeight)} kg
      </span>
    );
  }

  return null;
}

export function getInventorySection(
  character: CharacterDetail,
  activeGameId: string | null,
  options?: {
    mutate?: KeyedMutator<CharacterDetail | null>;
    readOnly?: boolean;
  }
): CharacterSectionSlide {
  const readOnly = options?.readOnly === true;
  const mutate = options?.mutate;

  return {
    id: "inventory",
    title: "Inventory",
    titleSupplement: (
      <InventoryCarryWeightTitleSupplement character={character} />
    ),
    children: (
      <InventorySectionContent
        character={character}
        mutate={mutate}
        activeGameId={activeGameId}
        readOnly={readOnly}
      />
    ),
  };
}
