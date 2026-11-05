"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail, ItemCharacter } from "@/app/lib/types/character";
import { AddItemToInventoryModal } from "@/app/components/character/AddItemToInventoryModal";
import { ItemDetailModal } from "@/app/components/character/ItemDetailModal";
import { Button } from "@/app/components/shared/Button";
import { CreateUniqueItemModal } from "@/app/components/games/CreateUniqueItemModal";
import {
  getCarriedInventory,
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
import type { RollPrivacyOptions } from "@/app/lib/roll-privacy";
import type { StashRename } from "@/app/lib/stashPlace";
import { getGameById, renameGameStash } from "@/lib/api/game";
import { EquipErrorModal } from "@/app/components/character/EquipErrorModal";
import { patchCharacterInventoryEntryAndMutate } from "@/lib/api/characterInventoryMutate";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import type { KeyedMutator } from "swr";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useStashDrawerOpenState } from "@/hooks/use-stash-drawer-open-state";
import { useStashPlaceNames } from "@/hooks/use-stash-place-names";
import {
  InventoryColumnHeader,
  InventoryHoldingRow,
  type CarriedHoldingRow,
  type HoldingRowShared,
} from "./InventoryHoldingRow";
import { StoredInventoryList } from "./StoredInventoryList";

type InventoryEntry = ItemCharacter;

function InventoryList({
  title,
  holdings,
  row,
}: {
  title: string;
  holdings: InventoryEntry[];
  row: CarriedHoldingRow;
}) {
  if (holdings.length === 0) return null;
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200 pb-1 mt-2 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-paleBlue">
          {title}
        </h3>
      </div>
      <InventoryColumnHeader variant="carried" />
      <ul className="divide-y divide-black">
        {holdings.map((holding) => (
          <InventoryHoldingRow
            key={holding.id}
            holding={holding}
            variant="carried"
            row={row}
          />
        ))}
      </ul>
    </div>
  );
}

interface InventorySectionContentProps {
  character: CharacterDetail;
  mutate?: KeyedMutator<CharacterDetail | null>;
  activeGameId: string | null;
  readOnly?: boolean;
  allowUniqueCreate?: boolean;
  rollPrivacy?: RollPrivacyOptions;
}

function InventorySectionContent({
  character,
  mutate,
  activeGameId,
  readOnly = false,
  allowUniqueCreate = !readOnly,
  rollPrivacy = { allowPrivateRoll: false, defaultPrivateRoll: false },
}: InventorySectionContentProps) {
  const [browseModalOpen, setBrowseModalOpen] = useState(false);
  const [createUniqueOpen, setCreateUniqueOpen] = useState(false);
  const [editUniqueItemId, setEditUniqueItemId] = useState<string | null>(null);
  const [detailEntry, setDetailEntry] = useState<InventoryEntry | null>(null);
  const [unequippingId, setUnequippingId] = useState<string | null>(null);
  const [equippingId, setEquippingId] = useState<string | null>(null);
  const [equipError, setEquipError] = useState<string | null>(null);
  const [stashRenameError, setStashRenameError] = useState<string | null>(null);
  const [stashRenameInFlight, setStashRenameInFlight] = useState(false);
  const canLoadPlaces = !readOnly && mutate !== undefined;
  const placeNames = useStashPlaceNames(
    character.id,
    activeGameId,
    character.inventory ?? [],
    canLoadPlaces
  );
  const { openByKey, setStashDrawerOpen } = useStashDrawerOpenState(
    character.id
  );

  useEffect(() => {
    if (!detailEntry || !character.inventory?.length) return;
    const updated = character.inventory.find((e) => e.id === detailEntry.id);
    if (updated) setDetailEntry(updated);
  }, [character.inventory, detailEntry]);

  const inventory = useMemo(
    () => character.inventory ?? [],
    [character.inventory]
  );
  const vehicleNamesById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const vehicle of character.vehicles ?? []) {
      map[vehicle.id] =
        vehicle.customName?.trim() ??
        vehicle.vehicle?.name?.trim() ??
        "Vehicle";
    }
    return map;
  }, [character.vehicles]);
  const characterGames = useMemo(
    () => Array.from(new Set((character.games ?? []).map((g) => g.gameId))),
    [character.games]
  );
  const carriedInventory = useMemo(
    () => sortInventoryEntriesAlphabetically(getCarriedInventory(inventory)),
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

  const handleAutoEquip = async (entry: InventoryEntry) => {
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

  const handleUnequip = async (entry: InventoryEntry) => {
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

  const canRenameStash = !readOnly && activeGameId != null && mutate != null;
  const renameStash = async (rename: StashRename) => {
    if (activeGameId == null || mutate == null) return;
    setStashRenameError(null);
    setStashRenameInFlight(true);
    try {
      await renameGameStash(activeGameId, rename);
      await mutate();
    } catch (error) {
      setStashRenameError(
        getUserSafeErrorMessage(error, "Could not rename this stash.")
      );
      throw error;
    } finally {
      setStashRenameInFlight(false);
    }
  };

  const storedRow: HoldingRowShared = {
    onSelectDetail: setDetailEntry,
    readOnly,
    vehicleNamesById,
  };
  const carriedRow: CarriedHoldingRow = {
    ...storedRow,
    onSelectEquip: readOnly
      ? null
      : (holding) => {
          void handleAutoEquip(holding);
        },
    onUnequip: (holding) => {
      void handleUnequip(holding);
    },
    unequippingId,
    equippingId,
  };

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
            {allowUniqueCreate ? (
              <Button
                type="button"
                variant="lightToolbarCompact"
                fullWidth={false}
                onClick={openCreateUnique}
                disabled={!canAddItems}
              >
                Create unique item
              </Button>
            ) : null}
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
            holdings={carriedInventory}
            row={carriedRow}
          />
          <StoredInventoryList
            characterId={character.id}
            holdings={inventory}
            openByKey={openByKey}
            onToggleStashDrawer={setStashDrawerOpen}
            onRenameStash={canRenameStash ? renameStash : undefined}
            renameDisabled={stashRenameInFlight}
            renameError={stashRenameError}
            row={storedRow}
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

      {createUniqueOpen && allowUniqueCreate && !readOnly && mutate && (
        <CreateUniqueItemModal
          isOpen={createUniqueOpen}
          draftScope={{ kind: "character", id: character.id }}
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

      {editUniqueItemId && allowUniqueCreate && !readOnly && mutate && (
        <CreateUniqueItemModal
          isOpen={Boolean(editUniqueItemId)}
          customTemplateGameIds={characterGames}
          editUniqueItemId={editUniqueItemId}
          onClose={() => {
            setEditUniqueItemId(null);
          }}
          onSuccess={() => {
            setEditUniqueItemId(null);
            setDetailEntry(null);
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
          placeNames={placeNames}
          resolveGiveRecipients={resolveGiveRecipients}
          equipControl={{
            carriedInventory,
            onEquip: handleAutoEquip,
            onUnequip: handleUnequip,
            equippingId,
            unequippingId,
          }}
          rollPrivacy={rollPrivacy}
          onEditUniqueItem={
            allowUniqueCreate && detailEntry.sourceType === "UNIQUE_ITEM"
              ? () => {
                  setEditUniqueItemId(detailEntry.itemId);
                  setDetailEntry(null);
                }
              : undefined
          }
          vehicleNamesById={vehicleNamesById}
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
    allowUniqueCreate?: boolean;
    rollPrivacy?: RollPrivacyOptions;
  }
): CharacterSectionSlide {
  const readOnly = options?.readOnly === true;
  const mutate = options?.mutate;
  const allowUniqueCreate = options?.allowUniqueCreate ?? !readOnly;
  const rollPrivacy = options?.rollPrivacy ?? {
    allowPrivateRoll: false,
    defaultPrivateRoll: false,
  };

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
        allowUniqueCreate={allowUniqueCreate}
        rollPrivacy={rollPrivacy}
      />
    ),
  };
}
