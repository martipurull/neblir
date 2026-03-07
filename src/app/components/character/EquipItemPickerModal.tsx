// eslint-disable-next-line no-unused-expressions
"use client";

import type { CharacterDetail } from "@/app/lib/types/character";
import type { EquipSlot } from "@/app/lib/types/character";
import type { DisplayEquipSlot } from "@/app/lib/equipUtils";
import {
  API_SLOT_CAPACITY,
  getApiSlotsForDisplay,
  getItemCost,
  getUsedCapacityInApiSlot,
  itemCanEquipInSlot,
} from "@/app/lib/equipUtils";
import { updateCharacterInventoryEntry } from "@/lib/api/items";
import type { KeyedMutator } from "swr";
import React, { useMemo, useState } from "react";

type InventoryEntry = NonNullable<CharacterDetail["inventory"]>[number];
type ResolvedItem = NonNullable<InventoryEntry["item"]>;

function fmt(n: number) {
  return n >= 0 ? `+${n}` : String(n);
}

function ItemCombatStats({ item }: { item: ResolvedItem }) {
  const parts: string[] = [];
  if (item.attackMeleeBonus != null)
    parts.push(`Melee ${fmt(item.attackMeleeBonus)}`);
  if (item.attackRangeBonus != null)
    parts.push(`Range ${fmt(item.attackRangeBonus)}`);
  if (item.attackThrowBonus != null)
    parts.push(`Throw ${fmt(item.attackThrowBonus)}`);
  if ("attackRoll" in item && item.attackRoll?.length) {
    parts.push(`Roll: ${item.attackRoll.join(", ")}`);
  }
  if ("damage" in item && item.damage) {
    parts.push(
      `${item.damage.numberOfDice}d${item.damage.diceType} ${item.damage.damageType?.join(", ") ?? ""}`
    );
  }
  if (parts.length === 0) return null;
  return <p className="mt-0.5 text-xs text-white/70">{parts.join(" · ")}</p>;
}

export interface EquipItemPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: DisplayEquipSlot;
  character: CharacterDetail;
  mutate: KeyedMutator<CharacterDetail | null>;
}

export function EquipItemPickerModal({
  isOpen,
  onClose,
  slot,
  character,
  mutate,
}: EquipItemPickerModalProps) {
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const inventory = useMemo(
    () => character.inventory ?? [],
    [character.inventory]
  );
  const apiSlots = getApiSlotsForDisplay(slot);

  const equippableEntries = useMemo(
    () =>
      inventory.filter(
        (entry) =>
          entry.item?.equippable === true &&
          apiSlots.some((s) =>
            itemCanEquipInSlot(s, entry.item?.equipSlotTypes ?? undefined)
          )
      ),
    [inventory, apiSlots]
  );

  const equippedInstances: { entry: InventoryEntry; apiSlot: EquipSlot }[] = [];
  for (const entry of equippableEntries) {
    for (const s of entry.equipSlots ?? []) {
      if (apiSlots.includes(s as EquipSlot)) {
        equippedInstances.push({ entry, apiSlot: s as EquipSlot });
      }
    }
  }

  const _usedCapacity = useMemo(
    () =>
      apiSlots.reduce(
        (sum, s) => sum + getUsedCapacityInApiSlot(inventory, s),
        0
      ),
    [inventory, apiSlots]
  );

  const entriesAvailableToEquip = equippableEntries.filter(
    (entry) => (entry.equipSlots ?? []).length < entry.quantity
  );

  const slotLabel =
    slot === "HAND" ? "Hand" : slot === "FOOT" ? "Foot" : "Body/Head";

  function pickApiSlotForEquip(entry: InventoryEntry): EquipSlot | null {
    const itemCost = getItemCost(entry.item?.equipSlotCost);
    for (const apiSlot of apiSlots) {
      if (!itemCanEquipInSlot(apiSlot, entry.item?.equipSlotTypes ?? undefined))
        continue;
      const used = getUsedCapacityInApiSlot(inventory, apiSlot);
      if (used + itemCost <= API_SLOT_CAPACITY) return apiSlot;
    }
    return null;
  }

  const handleEquip = async (entry: InventoryEntry) => {
    const apiSlot = pickApiSlotForEquip(entry);
    if (!apiSlot) return;
    setSubmittingId(entry.id);
    try {
      await updateCharacterInventoryEntry(character.id, entry.id, {
        action: "equip",
        slot: apiSlot,
      });
      await mutate();
      onClose();
    } finally {
      setSubmittingId(null);
    }
  };

  const handleUnequip = async (entry: InventoryEntry, apiSlot: EquipSlot) => {
    setSubmittingId(entry.id);
    try {
      await updateCharacterInventoryEntry(character.id, entry.id, {
        action: "unequip",
        slot: apiSlot,
      });
      await mutate();
      onClose();
    } finally {
      setSubmittingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="equip-picker-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[70vh] w-full max-w-sm flex-col rounded-lg border-2 border-white bg-modalBackground-200 p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between">
          <h2
            id="equip-picker-modal-title"
            className="text-lg font-semibold text-white"
          >
            {slotLabel} Equip
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
        <ul className="mt-4 flex min-h-0 flex-col divide-y divide-white/20 overflow-y-auto">
          {equippedInstances.length === 0 &&
          entriesAvailableToEquip.length === 0 ? (
            <li className="py-3 text-sm text-white/70">
              No equippable items for this slot
            </li>
          ) : (
            <>
              {equippedInstances.map(({ entry, apiSlot }, i) => {
                const name =
                  entry.customName ?? entry.item?.name ?? "Unknown item";
                const isSubmitting = submittingId === entry.id;
                return (
                  <li
                    key={`${entry.id}-${apiSlot}-${i}`}
                    className="flex items-start justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{name}</p>
                      {entry.item && <ItemCombatStats item={entry.item} />}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void handleUnequip(entry, apiSlot);
                      }}
                      disabled={isSubmitting}
                      className="shrink-0 rounded border border-neblirDanger-200 bg-transparent px-2 py-1 text-xs font-medium text-neblirDanger-400 transition-colors hover:bg-neblirDanger-200/20 disabled:opacity-50"
                    >
                      {isSubmitting ? "Unequipping…" : "Unequip"}
                    </button>
                  </li>
                );
              })}
              {entriesAvailableToEquip.map((entry) => {
                const name =
                  entry.customName ?? entry.item?.name ?? "Unknown item";
                const isSubmitting = submittingId === entry.id;
                const targetSlot = pickApiSlotForEquip(entry);
                const equipDisabled = !targetSlot || isSubmitting;
                return (
                  <li
                    key={entry.id}
                    className="flex items-start justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{name}</p>
                      {entry.item && <ItemCombatStats item={entry.item} />}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void handleEquip(entry);
                      }}
                      disabled={equipDisabled}
                      className="shrink-0 rounded border border-neblirSafe-200 bg-transparent px-2 py-1 text-xs font-medium text-neblirSafe-400 transition-colors hover:bg-neblirSafe-200/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? "Equipping…" : "Equip"}
                    </button>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
