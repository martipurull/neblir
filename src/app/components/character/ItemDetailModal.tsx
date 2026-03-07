// eslint-disable-next-line no-unused-expressions
"use client";

import {
  ITEM_LOCATION_CARRIED,
  isItemCarried,
} from "@/app/lib/constants/inventory";
import type { CharacterDetail } from "@/app/lib/types/character";
import {
  deleteCharacterInventoryEntry,
  updateCharacterInventoryEntry,
} from "@/lib/api/items";
import { useImageUrls } from "@/hooks/use-image-urls";
import type { KeyedMutator } from "swr";
import Image from "next/image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const USES_DEBOUNCE_MS = 2500;

type InventoryEntry = NonNullable<CharacterDetail["inventory"]>[number];

export interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: InventoryEntry;
  characterId: string;
  mutate: KeyedMutator<CharacterDetail | null>;
}

function fmt(n: number) {
  return n >= 0 ? `+${n}` : String(n);
}

export function ItemDetailModal({
  isOpen,
  onClose,
  entry,
  characterId,
  mutate,
}: ItemDetailModalProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [leaveLocationInput, setLeaveLocationInput] = useState("");

  const rawMax =
    entry.item && "maxUses" in entry.item
      ? (entry.item as { maxUses?: number | null }).maxUses
      : null;
  const maxUses: number | null = typeof rawMax === "number" ? rawMax : null;
  const [displayUses, setDisplayUses] = useState(entry.currentUses ?? 0);
  const usesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUsesRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplayUses(entry.currentUses ?? 0);
  }, [entry.currentUses, entry.id]);

  const saveUses = useCallback(async () => {
    const value = pendingUsesRef.current;
    pendingUsesRef.current = null;
    if (value === null || !characterId) return;
    try {
      await updateCharacterInventoryEntry(characterId, entry.id, {
        action: "setCurrentUses",
        currentUses: value,
      });
      await mutate();
    } catch {
      await mutate();
    }
  }, [characterId, entry.id, mutate]);

  const updateUses = useCallback(
    (delta: number) => {
      if (maxUses == null) return;
      const next = Math.max(0, Math.min(maxUses, (displayUses ?? 0) + delta));
      setDisplayUses(next);
      pendingUsesRef.current = next;
      if (usesTimeoutRef.current) clearTimeout(usesTimeoutRef.current);
      usesTimeoutRef.current = setTimeout(() => {
        usesTimeoutRef.current = null;
        void saveUses();
      }, USES_DEBOUNCE_MS);
    },
    [maxUses, displayUses, saveUses]
  );

  const carried = isItemCarried(entry);
  const displayLocation = carried ? "On hand" : (entry.itemLocation ?? "—");

  const itemImageKey =
    entry.item && "imageKey" in entry.item
      ? (entry.item as { imageKey?: string | null }).imageKey
      : null;
  const imageEntries = useMemo(
    () =>
      itemImageKey ? [{ id: `item-${entry.id}`, imageKey: itemImageKey }] : [],
    [entry.id, itemImageKey]
  );
  const imageUrls = useImageUrls(imageEntries);
  const itemImageUrl = itemImageKey
    ? (imageUrls[`item-${entry.id}`] ?? null)
    : null;

  const handleSetLocation = async (itemLocation: string) => {
    setLocationError(null);
    setIsSettingLocation(true);
    try {
      await updateCharacterInventoryEntry(characterId, entry.id, {
        action: "setLocation",
        itemLocation,
      });
      await mutate();
      setLeaveLocationInput("");
    } catch (e) {
      setLocationError(
        e instanceof Error ? e.message : "Failed to update location"
      );
    } finally {
      setIsSettingLocation(false);
    }
  };

  const handleRemove = async () => {
    setRemoveError(null);
    setIsRemoving(true);
    try {
      await deleteCharacterInventoryEntry(characterId, entry.id);
      await mutate();
      onClose();
    } catch (e) {
      setRemoveError(e instanceof Error ? e.message : "Failed to remove item");
    } finally {
      setIsRemoving(false);
    }
  };

  if (!isOpen) return null;

  const name = entry.customName ?? entry.item?.name ?? "Unknown item";
  const item = entry.item;
  const isWeapon = item?.type === "WEAPON";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-detail-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-lg border-2 border-white bg-modalBackground-200 p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2
            id="item-detail-modal-title"
            className="text-lg font-semibold text-white"
          >
            Item details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white transition-colors hover:bg-white/10"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className="text-white/60 uppercase tracking-wider">
                Name
              </span>
              <p className="mt-0.5 text-white">{name}</p>
            </div>
            {itemImageUrl && (
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg mr-4">
                <Image
                  src={itemImageUrl}
                  alt=""
                  width={80}
                  height={80}
                  className="h-20 w-20 object-cover object-center"
                  unoptimized
                />
              </div>
            )}
          </div>
          {item?.description && (
            <div>
              <span className="text-white/60 uppercase tracking-wider">
                Description
              </span>
              <p className="mt-0.5 text-white whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-white/60 uppercase tracking-wider">
                Type
              </span>
              <p className="mt-0.5 text-white">{item?.type ?? "—"}</p>
            </div>
            <div>
              <span className="text-white/60 uppercase tracking-wider">
                Weight
              </span>
              <p className="mt-0.5 text-white">
                {item?.weight != null ? `${item.weight} kg` : "—"}
              </p>
            </div>
            <div>
              <span className="text-white/60 uppercase tracking-wider">
                Quantity
              </span>
              <p className="mt-0.5 text-white">{entry.quantity}</p>
            </div>
            <div>
              <span className="text-white/60 uppercase tracking-wider">
                Status
              </span>
              <p className="mt-0.5 text-white">{entry.status}</p>
            </div>
            <div>
              <span className="text-white/60 uppercase tracking-wider">
                Location
              </span>
              <p className="mt-0.5 text-white">{displayLocation}</p>
            </div>
          </div>
          {maxUses != null && (
            <div className="mt-3 flex flex-col gap-2 rounded border border-white/20 p-3">
              <span className="block text-xs font-medium uppercase tracking-wider text-white/70">
                Uses
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateUses(-1)}
                  disabled={displayUses <= 0}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-white bg-transparent text-lg font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-transparent"
                  aria-label="Decrease uses"
                >
                  −
                </button>
                <span className="min-w-[4rem] text-center text-lg font-semibold tabular-nums text-white">
                  {displayUses} / {maxUses}
                </span>
                <button
                  type="button"
                  onClick={() => updateUses(1)}
                  disabled={displayUses >= maxUses}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-white bg-transparent text-lg font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-transparent"
                  aria-label="Increase uses"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-white/60">
                Changes save automatically after a short delay.
              </p>
            </div>
          )}
          <div className="mt-3 flex flex-col gap-2 rounded border border-white/20 p-3">
            <span className="block text-xs font-medium uppercase tracking-wider text-white/70">
              Change location
            </span>
            {carried ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={leaveLocationInput}
                  onChange={(e) => setLeaveLocationInput(e.target.value)}
                  placeholder="e.g. Safe house, Car trunk"
                  className="rounded border border-white/30 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                  aria-label="Where you left the item"
                />
                <button
                  type="button"
                  onClick={() => {
                    const loc = leaveLocationInput.trim();
                    if (loc) void handleSetLocation(loc);
                  }}
                  disabled={!leaveLocationInput.trim() || isSettingLocation}
                  className="rounded border border-white/30 bg-transparent px-3 py-2 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  {isSettingLocation ? "Updating…" : "Leave somewhere"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void handleSetLocation(ITEM_LOCATION_CARRIED)}
                disabled={isSettingLocation}
                className="rounded border border-white/30 bg-transparent px-3 py-2 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                {isSettingLocation ? "Updating…" : "Take with you"}
              </button>
            )}
            {locationError && (
              <p className="text-sm text-neblirDanger-400">{locationError}</p>
            )}
          </div>
          {item?.equippable && (
            <div>
              <span className="text-white/60 uppercase tracking-wider">
                Equipped
              </span>
              <p className="mt-0.5 text-white">
                {(entry.equipSlots?.length ?? 0) > 0
                  ? `${entry.equipSlots!.join(", ")} slot(s)`
                  : "No"}
              </p>
            </div>
          )}
          {isWeapon && item && (
            <>
              {"attackRoll" in item &&
                item.attackRoll &&
                item.attackRoll.length > 0 && (
                  <div>
                    <span className="text-white/60 uppercase tracking-wider">
                      Attack roll
                    </span>
                    <p className="mt-0.5 text-white">
                      {item.attackRoll.join(", ")}
                    </p>
                  </div>
                )}
              {"damage" in item && item.damage && (
                <div>
                  <span className="text-white/60 uppercase tracking-wider">
                    Damage
                  </span>
                  <p className="mt-0.5 text-white">
                    {item.damage.numberOfDice}d{item.damage.diceType}{" "}
                    {item.damage.damageType?.join(", ")}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {item.attackMeleeBonus != null && (
                  <div>
                    <span className="text-white/60 uppercase tracking-wider">
                      Melee atk
                    </span>
                    <p className="mt-0.5 text-white">
                      {fmt(item.attackMeleeBonus)}
                    </p>
                  </div>
                )}
                {item.attackRangeBonus != null && (
                  <div>
                    <span className="text-white/60 uppercase tracking-wider">
                      Range atk
                    </span>
                    <p className="mt-0.5 text-white">
                      {fmt(item.attackRangeBonus)}
                    </p>
                  </div>
                )}
                {item.attackThrowBonus != null && (
                  <div>
                    <span className="text-white/60 uppercase tracking-wider">
                      Throw atk
                    </span>
                    <p className="mt-0.5 text-white">
                      {fmt(item.attackThrowBonus)}
                    </p>
                  </div>
                )}
                {item.defenceMeleeBonus != null && (
                  <div>
                    <span className="text-white/60 uppercase tracking-wider">
                      Melee def
                    </span>
                    <p className="mt-0.5 text-white">
                      {fmt(item.defenceMeleeBonus)}
                    </p>
                  </div>
                )}
                {item.defenceRangeBonus != null && (
                  <div>
                    <span className="text-white/60 uppercase tracking-wider">
                      Range def
                    </span>
                    <p className="mt-0.5 text-white">
                      {fmt(item.defenceRangeBonus)}
                    </p>
                  </div>
                )}
                {item.gridAttackBonus != null && (
                  <div>
                    <span className="text-white/60 uppercase tracking-wider">
                      Grid atk
                    </span>
                    <p className="mt-0.5 text-white">
                      {fmt(item.gridAttackBonus)}
                    </p>
                  </div>
                )}
                {item.gridDefenceBonus != null && (
                  <div>
                    <span className="text-white/60 uppercase tracking-wider">
                      Grid def
                    </span>
                    <p className="mt-0.5 text-white">
                      {fmt(item.gridDefenceBonus)}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
          {!isWeapon && item && "usage" in item && item.usage && (
            <div>
              <span className="text-white/60 uppercase tracking-wider">
                Usage
              </span>
              <p className="mt-0.5 text-white">{item.usage}</p>
            </div>
          )}
          {item?.notes && (
            <div>
              <span className="text-white/60 uppercase tracking-wider">
                Notes
              </span>
              <p className="mt-0.5 text-white whitespace-pre-wrap">
                {item.notes}
              </p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={() => {
                void handleRemove();
              }}
              disabled={isRemoving}
              className="w-full rounded border-2 border-neblirDanger-200 bg-transparent px-4 py-2.5 text-sm font-medium text-neblirDanger-400 transition-colors hover:bg-neblirDanger-200/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRemoving ? "Removing…" : "Remove from inventory"}
            </button>
            {removeError && (
              <p className="mt-2 text-sm text-neblirDanger-400">
                {removeError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
