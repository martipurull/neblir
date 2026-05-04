"use client";

import Button from "@/app/components/shared/Button";
import { getCarriedInventory } from "@/app/lib/constants/inventory";
import type { CharacterDetail } from "@/app/lib/types/character";
import type { EquipSlot } from "@/app/lib/types/character";
import type { DisplayEquipSlot } from "@/app/lib/equipUtils";
import {
  entryCanAutoEquip,
  getApiSlotsForDisplay,
  itemCanEquipInSlot,
} from "@/app/lib/equipUtils";
import { EquipErrorModal } from "@/app/components/character/EquipErrorModal";
import { updateCharacterInventoryEntry } from "@/lib/api/items";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import type { KeyedMutator } from "swr";
import { useMemo, useState } from "react";
type InventoryEntry = NonNullable<CharacterDetail["inventory"]>[number];
type ResolvedItem = NonNullable<InventoryEntry["item"]>;

const SLOT_MODAL_LABELS: Record<DisplayEquipSlot, string> = {
  HAND: "Hand",
  FOOT: "Foot",
  BODY: "Body",
  HEAD: "Head",
  BRAIN: "Brain",
};

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
  if (item.effectiveRange != null) {
    parts.push(`Eff. range ${item.effectiveRange}`);
  }
  if (item.maxRange != null) {
    parts.push(`Max ${item.maxRange}`);
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
  const [equipError, setEquipError] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const carriedInventory = useMemo(
    () => getCarriedInventory(character.inventory ?? undefined),
    [character.inventory]
  );
  const apiSlots = getApiSlotsForDisplay(slot);

  const equippableEntries = useMemo(
    () =>
      carriedInventory.filter(
        (entry) =>
          entry.item?.equippable === true &&
          apiSlots.some((s) =>
            itemCanEquipInSlot(s, entry.item?.equipSlotTypes ?? undefined)
          )
      ),
    [carriedInventory, apiSlots]
  );

  const equippedInstances: { entry: InventoryEntry; apiSlot: EquipSlot }[] = [];
  for (const entry of equippableEntries) {
    for (const s of entry.equipSlots ?? []) {
      if (apiSlots.includes(s as EquipSlot)) {
        equippedInstances.push({ entry, apiSlot: s as EquipSlot });
      }
    }
  }

  const entriesAvailableToEquip = equippableEntries.filter((entry) =>
    entryCanAutoEquip(entry, carriedInventory)
  );

  const slotLabel = SLOT_MODAL_LABELS[slot];

  const handleEquip = async (entry: InventoryEntry) => {
    if (!entryCanAutoEquip(entry, carriedInventory)) return;
    setSubmittingId(entry.id);
    setEquipError(null);
    try {
      await updateCharacterInventoryEntry(character.id, entry.id, {
        action: "equip",
      });
      await mutate();
      onClose();
    } catch (e) {
      setEquipError({
        title: "Can't equip",
        message: getUserSafeErrorMessage(
          e,
          "Could not equip this item. Try again."
        ),
      });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleUnequip = async (entry: InventoryEntry, apiSlot: EquipSlot) => {
    setSubmittingId(entry.id);
    setEquipError(null);
    try {
      await updateCharacterInventoryEntry(character.id, entry.id, {
        action: "unequip",
        slot: apiSlot,
      });
      await mutate();
      onClose();
    } catch (e) {
      setEquipError({
        title: "Can't unequip",
        message: getUserSafeErrorMessage(
          e,
          "Could not remove this item from the slot. Try again."
        ),
      });
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
        className="flex max-h-[70vh] w-full max-w-sm flex-col overflow-hidden rounded-lg border-2 border-white bg-modalBackground-200 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/20 px-5 pb-3 pt-5">
          <h2
            id="equip-picker-modal-title"
            className="text-lg font-semibold text-white"
          >
            {slotLabel} Equip
          </h2>
          <Button
            type="button"
            variant="modalClose"
            fullWidth={false}
            onClick={onClose}
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </Button>
        </div>
        <ul className="flex min-h-0 flex-1 flex-col divide-y divide-white/20 overflow-y-auto px-5 pb-5 pt-4">
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
                    <Button
                      type="button"
                      variant="semanticDangerOutline"
                      fullWidth={false}
                      onClick={() => {
                        void handleUnequip(entry, apiSlot);
                      }}
                      disabled={isSubmitting}
                      className="shrink-0 !px-2 !py-1 !text-xs"
                    >
                      {isSubmitting ? "Unequipping…" : "Unequip"}
                    </Button>
                  </li>
                );
              })}
              {entriesAvailableToEquip.map((entry) => {
                const name =
                  entry.customName ?? entry.item?.name ?? "Unknown item";
                const isSubmitting = submittingId === entry.id;
                const equipDisabled =
                  !entryCanAutoEquip(entry, carriedInventory) || isSubmitting;
                return (
                  <li
                    key={entry.id}
                    className="flex items-start justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{name}</p>
                      {entry.item && <ItemCombatStats item={entry.item} />}
                    </div>
                    <Button
                      type="button"
                      variant="semanticSafeOutline"
                      fullWidth={false}
                      onClick={() => {
                        void handleEquip(entry);
                      }}
                      disabled={equipDisabled}
                      className="shrink-0 !px-2 !py-1 !text-xs"
                    >
                      {isSubmitting ? "Equipping…" : "Equip"}
                    </Button>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      </div>

      <EquipErrorModal
        isOpen={equipError != null}
        title={equipError?.title}
        message={equipError?.message ?? ""}
        onClose={() => setEquipError(null)}
      />
    </div>
  );
}
