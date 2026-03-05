"use client";

import type { EquipSlot } from "@/app/lib/types/character";
import React from "react";

const SLOTS: EquipSlot[] = ["HAND", "FOOT", "BODY"];

export interface EquipSlotChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Count of items already in each slot (so we can disable when >= 2) */
  slotCounts: Record<EquipSlot, number>;
  onSelect: (slot: EquipSlot) => void;
}

const MAX_PER_SLOT = 2;

export function EquipSlotChoiceModal({
  isOpen,
  onClose,
  slotCounts,
  onSelect,
}: EquipSlotChoiceModalProps) {
  if (!isOpen) return null;

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
            className="rounded p-1 text-white transition-colors hover:bg-white/10"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {SLOTS.map((slot) => {
            const full = slotCounts[slot] >= MAX_PER_SLOT;
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
                className="rounded border-2 border-white bg-transparent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
              >
                {slot === "HAND" ? "Hand" : slot === "FOOT" ? "Foot" : "Body"}
                {full && " (full)"}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
