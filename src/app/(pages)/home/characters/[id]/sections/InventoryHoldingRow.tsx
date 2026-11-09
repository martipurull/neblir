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

/** What every inventory row needs: open the holding, and how to show it. */
export type HoldingRowShared = {
  onSelectDetail: (holding: ItemCharacter) => void;
  readOnly?: boolean;
  vehicleNamesById?: Readonly<Record<string, string>>;
  botNamesById?: Readonly<Record<string, string>>;
};

/** Equip controls for an On hand row. A stored row does not take these. */
export type CarriedHoldingRow = HoldingRowShared & {
  onSelectEquip: ((holding: ItemCharacter) => void) | null;
  onUnequip: (holding: ItemCharacter) => void;
  unequippingId: string | null;
  equippingId: string | null;
};

type InventoryHoldingRowProps = {
  holding: ItemCharacter;
  locationLabel?: string | null;
} & (
  | { variant: "carried"; row: CarriedHoldingRow }
  | { variant: "stored"; row: HoldingRowShared }
);

function inventoryGridClass(variant: "carried" | "stored"): string {
  return variant === "stored" ? STORED_GRID : CARRIED_GRID;
}

function HoldingName({
  name,
  equipSlots,
  nameClassName,
}: {
  name: string;
  equipSlots?: readonly string[];
  nameClassName?: string;
}) {
  const slots = equipSlots ?? [];
  return (
    <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0">
      <span className={nameClassName}>{name}</span>
      {slots.length > 0 ? (
        <span className="shrink-0 text-xs text-black">
          ({slots.map((slot) => slot.toLowerCase()).join(", ")})
        </span>
      ) : null}
    </div>
  );
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

export function InventoryHoldingRow(props: InventoryHoldingRowProps) {
  const { holding, locationLabel } = props;
  const { onSelectDetail, vehicleNamesById, botNamesById } = props.row;
  const readOnly = props.row.readOnly === true;
  const name = holding.customName ?? holding.item?.name ?? "Unknown item";
  const weight = holding.item?.weight;
  const equippable = holding.item?.equippable === true;
  const operational = isItemInventoryOperational(holding.status);
  const hasEquippedSlots = (holding.equipSlots?.length ?? 0) > 0;
  const location =
    props.variant === "stored"
      ? (locationLabel ??
        formatItemLocationLabel(holding.itemLocation, {
          vehicleNamesById,
          botNamesById,
        }))
      : null;
  const gridClass = inventoryGridClass(props.variant);

  return (
    <li className={`${gridClass} items-start py-2.5`}>
      {readOnly ? (
        <div className="min-w-0 break-words text-sm text-black">
          <HoldingName name={name} equipSlots={holding.equipSlots} />
        </div>
      ) : (
        <Button
          type="button"
          variant="lightRowHit"
          fullWidth={false}
          onClick={() => onSelectDetail(holding)}
        >
          <HoldingName
            name={name}
            equipSlots={holding.equipSlots}
            nameClassName="break-words text-sm text-black"
          />
        </Button>
      )}
      <span className="text-right text-sm tabular-nums text-black">
        {holding.quantity ?? 1}
      </span>
      <span className="text-right text-sm tabular-nums text-black">
        {weight != null ? `${formatWeightKgForDisplay(weight)} kg` : "—"}
      </span>
      {props.variant === "stored" ? (
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
          ) : hasEquippedSlots ? (
            <Button
              type="button"
              variant="lightPillAction"
              fullWidth={false}
              onClick={(event) => {
                event.stopPropagation();
                void props.row.onUnequip(holding);
              }}
              disabled={
                props.row.unequippingId === holding.id ||
                props.row.equippingId === holding.id
              }
            >
              {props.row.unequippingId === holding.id
                ? "Unequipping…"
                : "Unequip"}
            </Button>
          ) : props.row.onSelectEquip != null && equippable && operational ? (
            <Button
              type="button"
              variant="lightPillAction"
              fullWidth={false}
              disabled={props.row.equippingId === holding.id}
              onClick={(event) => {
                event.stopPropagation();
                props.row.onSelectEquip?.(holding);
              }}
            >
              {props.row.equippingId === holding.id ? "Equipping…" : "Equip"}
            </Button>
          ) : equippable && !operational ? (
            <div className="flex w-full justify-end">
              <div className="flex flex-col p-1 text-right text-[10px] font-medium leading-tight text-neblirDanger-600">
                {holding.status === "BEYOND_REPAIR" ? (
                  <>
                    <span>beyond</span>
                    <span>repair</span>
                  </>
                ) : (
                  <span>
                    {itemStatusEquipColumnDamageLabel(holding.status) ?? "—"}
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
