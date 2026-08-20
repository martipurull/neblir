"use client";

import { BrowseItemDetailsView } from "@/app/components/items/BrowseItemDetailsView";
import type { ItemBrowseDetailFields } from "@/app/lib/types/itemBrowseDetail";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { Button } from "@/app/components/shared/Button";
import { useState } from "react";

const MAX_ADD_QUANTITY = 10;

function parseAddQuantity(raw: string): number {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_ADD_QUANTITY);
}

function BrowseItemDetailAddFooter({
  item,
  isAdding,
  onAddToInventory,
}: {
  item: ItemBrowseDetailFields;
  isAdding: boolean;
  onAddToInventory: (
    item: ItemBrowseDetailFields,
    quantity: number
  ) => void | Promise<void>;
}) {
  const [addQuantity, setAddQuantity] = useState("1");

  return (
    <>
      <ModalNumberField
        id={`browse-item-add-quantity-${item.id}`}
        label="Quantity"
        value={addQuantity}
        onChange={setAddQuantity}
        disabled={isAdding}
        required={false}
        min={1}
        max={MAX_ADD_QUANTITY}
        step={1}
      />
      <Button
        type="button"
        variant="semanticSafeOutline"
        onClick={() => {
          void onAddToInventory(item, parseAddQuantity(addQuantity));
        }}
        disabled={isAdding}
        className="w-full"
      >
        {isAdding ? "Adding…" : "Add to inventory"}
      </Button>
    </>
  );
}

export interface BrowseItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemBrowseDetailFields | null;
  /** When provided, shows quantity + add controls (modal stays open after add). */
  onAddToInventory?: (
    item: ItemBrowseDetailFields,
    quantity: number
  ) => void | Promise<void>;
  /** When adding from this modal, pass true to show loading state */
  isAdding?: boolean;
  /** GM flow: opens give-to-character UI for this item */
  onGiveToCharacter?: () => void;
  /** Opens edit UI for this item (GM custom items or owned unique items). */
  onEdit?: () => void;
}

export function BrowseItemDetailModal({
  isOpen,
  onClose,
  item,
  onAddToInventory,
  isAdding = false,
  onGiveToCharacter,
  onEdit,
}: BrowseItemDetailModalProps) {
  if (!isOpen || !item) return null;

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title="Item details"
      titleId="browse-item-detail-modal-title"
      zIndexClass="z-[60]"
      maxWidthClass="max-w-md"
      maxHeightClass="max-h-[90vh]"
      footer={
        onGiveToCharacter || onAddToInventory || onEdit ? (
          <div className="flex w-full flex-col gap-2">
            {onEdit ? (
              <Button
                type="button"
                variant="primarySm"
                onClick={onEdit}
                className="w-full"
              >
                Edit item
              </Button>
            ) : null}
            {onGiveToCharacter ? (
              <Button
                type="button"
                variant="semanticSafeOutline"
                onClick={onGiveToCharacter}
                className="w-full"
              >
                Give item to character
              </Button>
            ) : null}
            {onAddToInventory ? (
              <BrowseItemDetailAddFooter
                key={item.id}
                item={item}
                isAdding={isAdding}
                onAddToInventory={onAddToInventory}
              />
            ) : null}
          </div>
        ) : undefined
      }
    >
      <BrowseItemDetailsView item={item} />
    </ModalShell>
  );
}
