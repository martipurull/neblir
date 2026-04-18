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
import Button from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
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
    <ModalShell
      isOpen
      onClose={handleClose}
      title="Give item to character"
      titleId="give-item-title"
      subtitle="Choose a character and an item to add to their inventory."
      closeDisabled={submitting}
      maxWidthClass="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="modalFooterSecondary"
            fullWidth={false}
            className="!border-white/50 font-medium"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="give-item-modal-form"
            variant="modalFooterPrimary"
            fullWidth={false}
            className="font-medium !text-modalBackground-200 disabled:pointer-events-none"
            disabled={
              submitting || !characterId || !itemId || characters.length === 0
            }
          >
            {submitting ? "Giving…" : "Give item"}
          </Button>
        </div>
      }
    >
      <form
        id="give-item-modal-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
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
      </form>
    </ModalShell>
  );
}
