"use client";

import type { CharacterDetail } from "@/app/lib/types/character";
import type { EquipSlot } from "@/app/lib/types/character";
import {
  API_SLOT_CAPACITY,
  getItemCost,
  getUsedCapacityInApiSlot,
  itemCanEquipInSlot,
} from "@/app/lib/equipUtils";
import React from "react";

const SLOTS: EquipSlot[] = ["HAND", "FOOT", "BODY", "HEAD"];

type InventoryEntry = NonNullable<CharacterDetail["inventory"]>[number];

export interface EquipSlotChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The item being equipped - used to filter slots by equipSlotTypes and check capacity */
  entry: InventoryEntry;
  /** Inventory for computing used capacity per slot */
  inventory: InventoryEntry[];
  onSelect: (slot: EquipSlot) => void;
}

const slotLabels: Record<EquipSlot, string> = {
  HAND: "Hand",
  FOOT: "Foot",
  BODY: "Body",
  HEAD: "Head",
};

export function EquipSlotChoiceModal({
  isOpen,
  onClose,
  entry,
  inventory,
  onSelect,
}: EquipSlotChoiceModalProps) {
  if (!isOpen) return null;

  const itemCost = getItemCost(entry.item?.equipSlotCost);

  const slotsToShow = SLOTS.filter((slot) =>
    itemCanEquipInSlot(slot, entry.item?.equipSlotTypes ?? undefined)
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="equip-slot-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-lg border-2 border-white bg-modalBackground-200 p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2
            id="equip-slot-modal-title"
            className="text-lg font-semibold text-white"
          >
            Equip to
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white transition-colors hover:bg-paleBlue/10"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {slotsToShow.map((slot) => {
            const used = getUsedCapacityInApiSlot(inventory, slot);
            const full = used + itemCost > API_SLOT_CAPACITY;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => {
                  if (!full) {
                    onSelect(slot);
                    onClose();
                  }
                }}
                disabled={full}
                className="rounded border-2 border-white bg-transparent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-paleBlue/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
              >
                {slotLabels[slot]}
                {full && " (full)"}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
