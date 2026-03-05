"use client";

import type { CharacterDetail } from "@/app/lib/types/character";
import { deleteCharacterInventoryEntry } from "@/lib/api/items";
import type { KeyedMutator } from "swr";
import React, { useState } from "react";

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
          <div>
            <span className="text-white/60 uppercase tracking-wider">Name</span>
            <p className="mt-0.5 text-white">{name}</p>
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
          </div>
          {item?.equippable && (
            <div>
              <span className="text-white/60 uppercase tracking-wider">
                Equipped
              </span>
              <p className="mt-0.5 text-white">
                {entry.equipSlot ? `${entry.equipSlot} slot` : "No"}
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
              onClick={handleRemove}
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
