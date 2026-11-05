"use client";

import { Button } from "@/app/components/shared/Button";
import { formatItemLocationLabel } from "@/app/lib/constants/inventory";
import { formatWeightKgForDisplay } from "@/app/lib/carryWeightUtils";
import type { ItemCharacter } from "@/app/lib/types/character";
import {
  isItemInventoryOperational,
  itemStatusEquipColumnDamageLabel,
} from "@/app/lib/types/item";

const CARRIED_GRID = "grid grid-cols-[minmax(0,1fr)_2.5rem_3rem_4.5rem] gap-3";
const STORED_GRID =
  "grid grid-cols-[minmax(0,1fr)_2.5rem_3rem_minmax(5.5rem,11rem)] gap-3";

type InventoryHoldingRowProps = {
  entry: ItemCharacter;
  variant: "carried" | "stored";
  onSelectDetail: (entry: ItemCharacter) => void;
  onSelectEquip: ((entry: ItemCharacter) => void) | null;
  onUnequip: (entry: ItemCharacter) => void;
  unequippingId: string | null;
  equippingId: string | null;
  readOnly?: boolean;
  vehicleNamesById?: Readonly<Record<string, string>>;
  locationLabel?: string | null;
};

function inventoryGridClass(variant: "carried" | "stored"): string {
  return variant === "stored" ? STORED_GRID : CARRIED_GRID;
}

export function InventoryColumnHeader({
  variant,
}: {
  variant: "carried" | "stored";
}) {
  const lastColumnLabel = variant === "stored" ? "Location" : "Equip";
  return (
    <div
      className={`${inventoryGridClass(variant)} mt-2 border-b border-black pb-2 text-xs font-medium uppercase tracking-widest text-black`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="h-3 w-px shrink-0 bg-black" aria-hidden />
        Item
      </span>
      <span className="text-right">Qty</span>
      <span className="text-right">Weight</span>
      <span className="text-right">{lastColumnLabel}</span>
    </div>
  );
}

export function InventoryHoldingRow({
  entry,
  variant,
  onSelectDetail,
  onSelectEquip,
  onUnequip,
  unequippingId,
  equippingId,
  readOnly = false,
  vehicleNamesById,
  locationLabel,
}: InventoryHoldingRowProps) {
  const name = entry.customName ?? entry.item?.name ?? "Unknown item";
  const weight = entry.item?.weight;
  const equippable = entry.item?.equippable === true;
  const operational = isItemInventoryOperational(entry.status);
  const hasEquippedSlots = (entry.equipSlots?.length ?? 0) > 0;
  const showUnequip = variant === "carried" && hasEquippedSlots;
  const showEquipButton =
    variant === "carried" &&
    onSelectEquip != null &&
    equippable &&
    operational &&
    !hasEquippedSlots;
  const location =
    variant === "stored"
      ? (locationLabel ??
        formatItemLocationLabel(entry.itemLocation, { vehicleNamesById }))
      : null;
  const gridClass = inventoryGridClass(variant);

  return (
    <li className={`${gridClass} items-start py-2.5`}>
      {readOnly ? (
        <div className="min-w-0 break-words text-sm text-black">
          <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0">
            <span>{name}</span>
            {(entry.equipSlots?.length ?? 0) > 0 && (
              <span className="shrink-0 text-xs text-black">
                (
                {entry.equipSlots!.map((slot) => slot.toLowerCase()).join(", ")}
                )
              </span>
            )}
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="lightRowHit"
          fullWidth={false}
          onClick={() => onSelectDetail(entry)}
        >
          <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0">
            <span className="break-words text-sm text-black">{name}</span>
            {(entry.equipSlots?.length ?? 0) > 0 && (
              <span className="shrink-0 text-xs text-black">
                (
                {entry.equipSlots!.map((slot) => slot.toLowerCase()).join(", ")}
                )
              </span>
            )}
          </div>
        </Button>
      )}
      <span className="text-right text-sm tabular-nums text-black">
        {entry.quantity ?? 1}
      </span>
      <span className="text-right text-sm tabular-nums text-black">
        {weight != null ? `${formatWeightKgForDisplay(weight)} kg` : "—"}
      </span>
      {variant === "stored" ? (
        <span
          className="min-w-0 truncate text-right text-sm text-black"
          title={location ?? undefined}
        >
          {location ?? "—"}
        </span>
      ) : (
        <div className="flex justify-end">
          {readOnly ? (
            <span className="text-xs text-black/50">—</span>
          ) : showUnequip ? (
            <Button
              type="button"
              variant="lightPillAction"
              fullWidth={false}
              onClick={(event) => {
                event.stopPropagation();
                void onUnequip(entry);
              }}
              disabled={unequippingId === entry.id || equippingId === entry.id}
            >
              {unequippingId === entry.id ? "Unequipping…" : "Unequip"}
            </Button>
          ) : showEquipButton ? (
            <Button
              type="button"
              variant="lightPillAction"
              fullWidth={false}
              disabled={equippingId === entry.id}
              onClick={(event) => {
                event.stopPropagation();
                onSelectEquip(entry);
              }}
            >
              {equippingId === entry.id ? "Equipping…" : "Equip"}
            </Button>
          ) : equippable && !operational ? (
            <div className="flex w-full justify-end">
              <div className="flex flex-col p-1 text-right text-[10px] font-medium leading-tight text-neblirDanger-600">
                {entry.status === "BEYOND_REPAIR" ? (
                  <>
                    <span>beyond</span>
                    <span>repair</span>
                  </>
                ) : (
                  <span>
                    {itemStatusEquipColumnDamageLabel(entry.status) ?? "—"}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-xs text-black/50">—</span>
          )}
        </div>
      )}
    </li>
  );
}
