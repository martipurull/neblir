"use client";

import type { GameDetail } from "@/app/lib/types/game";
import {
  ModalSelect,
  type ModalSelectOption,
} from "@/app/components/games/shared/ModalSelect";
import { giveItemToCharacter } from "@/lib/api/game";
import type { ItemWithId } from "@/lib/api/items";
import { getItems } from "@/lib/api/items";
import { getGameUniqueItems } from "@/lib/api/uniqueItems";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import React, { useCallback, useEffect, useState } from "react";

export type GiveItemOption = {
  sourceType: "GLOBAL_ITEM" | "CUSTOM_ITEM" | "UNIQUE_ITEM";
  itemId: string;
  label: string;
};

export type GiveItemToCharacterModalProps = {
  isOpen: boolean;
  gameId: string;
  game: GameDetail;
  onClose: () => void;
  onSuccess?: () => void;
};

export function GiveItemToCharacterModal({
  isOpen,
  gameId,
  game,
  onClose,
  onSuccess,
}: GiveItemToCharacterModalProps) {
  const [globalItems, setGlobalItems] = useState<ItemWithId[]>([]);
  const [uniqueItems, setUniqueItems] = useState<
    { id: string; name: string }[]
  >([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingUniqueItems, setLoadingUniqueItems] = useState(false);
  const [characterId, setCharacterId] = useState("");
  const [sourceType, setSourceType] = useState<
    "GLOBAL_ITEM" | "CUSTOM_ITEM" | "UNIQUE_ITEM"
  >("GLOBAL_ITEM");
  const [itemId, setItemId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const characters = game.characters ?? [];
  const customItems = game.customItems ?? [];

  const loadGlobalItems = useCallback(async () => {
    setLoadingItems(true);
    setError(null);
    try {
      const items = await getItems();
      setGlobalItems(items);
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to load items"));
    } finally {
      setLoadingItems(false);
    }
  }, []);

  const loadUniqueItems = useCallback(async () => {
    setLoadingUniqueItems(true);
    setError(null);
    try {
      const data = await getGameUniqueItems(gameId);
      setUniqueItems(data);
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to load unique items"));
      setUniqueItems([]);
    } finally {
      setLoadingUniqueItems(false);
    }
  }, [gameId]);

  useEffect(() => {
    if (isOpen) {
      setCharacterId("");
      setSourceType("GLOBAL_ITEM");
      setItemId("");
      setError(null);
      void loadGlobalItems();
      void loadUniqueItems();
    }
  }, [isOpen, loadGlobalItems, loadUniqueItems]);

  useEffect(() => {
    setItemId("");
  }, [sourceType]);

  const itemOptions: GiveItemOption[] =
    sourceType === "GLOBAL_ITEM"
      ? globalItems.map((i) => ({
          sourceType: "GLOBAL_ITEM" as const,
          itemId: i.id,
          label: i.name,
        }))
      : sourceType === "CUSTOM_ITEM"
        ? customItems.map((i) => ({
            sourceType: "CUSTOM_ITEM" as const,
            itemId: i.id,
            label: i.name,
          }))
        : sourceType === "UNIQUE_ITEM"
          ? uniqueItems.map((i) => ({
              sourceType: "UNIQUE_ITEM" as const,
              itemId: i.id,
              label: i.name,
            }))
          : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!characterId || !itemId) {
      setError("Select a character and an item.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await giveItemToCharacter(gameId, {
        characterId,
        sourceType,
        itemId,
      });
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to give item"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCharacterId("");
    setSourceType("GLOBAL_ITEM");
    setItemId("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const characterDisplayName = (c: (typeof characters)[0]) =>
    [c.character.name, c.character.surname].filter(Boolean).join(" ").trim() ||
    "Unnamed";

  const characterOptions: ModalSelectOption[] = characters.map((gc) => ({
    value: gc.character.id,
    label: characterDisplayName(gc),
  }));

  const sourceTypeOptions: ModalSelectOption[] = [
    { value: "GLOBAL_ITEM", label: "Global item" },
    { value: "CUSTOM_ITEM", label: "Custom item" },
    { value: "UNIQUE_ITEM", label: "Unique item" },
  ];

  const selectItemOptions: ModalSelectOption[] = itemOptions.map((o) => ({
    value: o.itemId,
    label: o.label,
  }));

  const itemSelectPlaceholder =
    sourceType === "GLOBAL_ITEM"
      ? loadingItems
        ? "Loading…"
        : globalItems.length === 0
          ? "No global items"
          : "Select item"
      : sourceType === "CUSTOM_ITEM"
        ? customItems.length === 0
          ? "No custom items"
          : "Select item"
        : loadingUniqueItems
          ? "Loading…"
          : uniqueItems.length === 0
            ? "No unique items"
            : "Select item";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="give-item-title"
    >
      <div className="w-full max-w-md rounded-lg border-2 border-white bg-modalBackground-200 p-5 shadow-lg sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="give-item-title"
              className="text-lg font-semibold text-white"
            >
              Give item to character
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Choose a character and an item to add to their inventory.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="shrink-0 rounded p-1.5 text-white transition-colors hover:bg-white/10 disabled:opacity-50"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <ModalSelect
            id="give-item-character"
            label="Character"
            placeholder={
              characters.length === 0
                ? "No characters in game"
                : "Select character"
            }
            value={characterId}
            options={characterOptions}
            disabled={submitting || characters.length === 0}
            onChange={setCharacterId}
          />

          <ModalSelect
            id="give-item-source"
            label="Item type"
            placeholder="Item type"
            value={sourceType}
            options={sourceTypeOptions}
            disabled={submitting}
            onChange={(v) =>
              setSourceType(v as "GLOBAL_ITEM" | "CUSTOM_ITEM" | "UNIQUE_ITEM")
            }
          />

          <ModalSelect
            id="give-item-item"
            label="Item"
            placeholder={itemSelectPlaceholder}
            value={itemId}
            options={selectItemOptions}
            disabled={
              submitting ||
              (sourceType === "GLOBAL_ITEM" &&
                (loadingItems || globalItems.length === 0)) ||
              (sourceType === "CUSTOM_ITEM" && customItems.length === 0) ||
              (sourceType === "UNIQUE_ITEM" &&
                (loadingUniqueItems || uniqueItems.length === 0))
            }
            onChange={setItemId}
          />

          {error && <p className="text-sm text-red-300 break-words">{error}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-md border-2 border-white/50 bg-transparent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting || !characterId || !itemId || characters.length === 0
              }
              className="rounded-md border-2 border-white bg-white px-3 py-2 text-sm font-medium text-modalBackground-200 transition-colors hover:bg-white/90 disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? "Giving…" : "Give item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
