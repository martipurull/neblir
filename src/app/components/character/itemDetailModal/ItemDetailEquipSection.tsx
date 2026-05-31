"use client";

import { Button } from "@/app/components/shared/Button";
import { entryCanAutoEquip } from "@/app/lib/equipUtils";
import {
  isItemInventoryOperational,
  itemStatusEquipColumnDamageLabel,
} from "@/app/lib/types/item";
import type { InventoryEntry } from "./types";

type ItemDetailEquipSectionProps = {
  entry: InventoryEntry;
  carried: boolean;
  carriedInventory: InventoryEntry[];
  equippingId: string | null;
  unequippingId: string | null;
  onEquip: () => void;
  onUnequip: () => void;
};

export function ItemDetailEquipSection({
  entry,
  carried,
  carriedInventory,
  equippingId,
  unequippingId,
  onEquip,
  onUnequip,
}: ItemDetailEquipSectionProps) {
  const equippable = entry.item?.equippable === true;
  if (!equippable) return null;

  const operational = isItemInventoryOperational(entry.status);
  const hasEquippedSlots = (entry.equipSlots?.length ?? 0) > 0;
  const canEquip =
    carried &&
    operational &&
    !hasEquippedSlots &&
    entryCanAutoEquip(entry, carriedInventory);
  const isBusy = equippingId === entry.id || unequippingId === entry.id;
  const damageLabel = itemStatusEquipColumnDamageLabel(entry.status);

  return (
    <div className="space-y-2 border-t border-white/20 pt-4">
      <span className="text-white/60 uppercase tracking-wider text-xs">
        Equip
      </span>
      {!carried ? (
        <p className="text-sm text-white/80">
          This item is stored elsewhere. Use &ldquo;Take with you&rdquo; above
          to carry it on hand before equipping.
        </p>
      ) : !operational && damageLabel ? (
        <p className="text-sm text-neblirDanger-600">
          {entry.status === "BEYOND_REPAIR"
            ? "Beyond repair — cannot equip."
            : `Item is ${damageLabel} — repair or replace before equipping.`}
        </p>
      ) : hasEquippedSlots ? (
        <Button
          type="button"
          variant="semanticWarningOutline"
          fullWidth
          disabled={isBusy}
          onClick={onUnequip}
        >
          {unequippingId === entry.id ? "Unequipping…" : "Unequip"}
        </Button>
      ) : canEquip ? (
        <Button
          type="button"
          variant="semanticSafeOutline"
          fullWidth
          disabled={isBusy}
          onClick={onEquip}
        >
          {equippingId === entry.id ? "Equipping…" : "Equip"}
        </Button>
      ) : (
        <p className="text-sm text-white/80">
          No room in the relevant equip areas, or this stack is already fully
          equipped.
        </p>
      )}
    </div>
  );
}
