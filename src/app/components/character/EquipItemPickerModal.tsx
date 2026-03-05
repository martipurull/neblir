"use client";

import type { CharacterDetail } from "@/app/lib/types/character";
import type { EquipSlot } from "@/app/lib/types/character";
import { updateCharacterInventoryEntry } from "@/lib/api/items";
import type { KeyedMutator } from "swr";
import React, { useState } from "react";

type InventoryEntry = NonNullable<CharacterDetail["inventory"]>[number];

export interface EquipItemPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: EquipSlot;
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

  const equippableEntries = (character.inventory ?? []).filter(
    (entry) => entry.item?.equippable === true
  );

  const slotLabel =
    slot === "HAND" ? "Hand" : slot === "FOOT" ? "Foot" : "Body";

  const handleSelect = async (entry: InventoryEntry) => {
    setSubmittingId(entry.id);
    try {
      await updateCharacterInventoryEntry(character.id, entry.id, {
        equipSlot: slot,
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
        className="w-full max-w-xs rounded-lg border-2 border-white bg-modalBackground-200 p-5 shadow-lg max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between shrink-0">
          <h2
            id="equip-picker-modal-title"
            className="text-lg font-semibold text-white"
          >
            Equip to {slotLabel}
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
        <ul className="mt-4 min-h-0 overflow-y-auto divide-y divide-white/20">
          {equippableEntries.length === 0 ? (
            <li className="py-3 text-sm text-white/70">No equippable items</li>
          ) : (
            equippableEntries.map((entry) => {
              const name =
                entry.customName ?? entry.item?.name ?? "Unknown item";
              const isSubmitting = submittingId === entry.id;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(entry)}
                    disabled={isSubmitting}
                    className="w-full py-2.5 text-left text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    {isSubmitting ? "Equipping…" : name}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
