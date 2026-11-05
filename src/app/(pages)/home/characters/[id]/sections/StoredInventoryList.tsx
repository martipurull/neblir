"use client";

import { Button } from "@/app/components/shared/Button";
import { projectStoredInventory } from "@/app/lib/storedInventory";
import type { ItemCharacter } from "@/app/lib/types/character";
import { useMemo } from "react";
import {
  InventoryColumnHeader,
  InventoryHoldingRow,
} from "./InventoryHoldingRow";

type StoredInventoryListProps = {
  characterId: string;
  holdings: ItemCharacter[];
  openByKey: Readonly<Record<string, boolean>>;
  onToggleDrawer: (placeKey: string, open: boolean) => void;
  onSelectDetail: (entry: ItemCharacter) => void;
  onUnequip: (entry: ItemCharacter) => void;
  unequippingId: string | null;
  equippingId: string | null;
  readOnly?: boolean;
  vehicleNamesById?: Readonly<Record<string, string>>;
};

export function StoredInventoryList({
  characterId,
  holdings,
  openByKey,
  onToggleDrawer,
  onSelectDetail,
  onUnequip,
  unequippingId,
  equippingId,
  readOnly = false,
  vehicleNamesById,
}: StoredInventoryListProps) {
  const layout = useMemo(
    () =>
      projectStoredInventory(holdings, {
        vehicleNamesById,
        openByKey,
      }),
    [holdings, openByKey, vehicleNamesById]
  );

  if (layout.vehicleRows.length === 0 && layout.drawers.length === 0) {
    return null;
  }

  const showColumnHeader =
    layout.vehicleRows.length > 0 ||
    layout.drawers.some((drawer) => drawer.open);

  return (
    <div className="mb-6">
      <div className="border-b border-gray-200 pb-1 mt-2 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-paleBlue">
          Stored
        </h3>
      </div>
      {showColumnHeader ? <InventoryColumnHeader variant="stored" /> : null}
      {layout.vehicleRows.length > 0 ? (
        <ul className="divide-y divide-black">
          {layout.vehicleRows.map((row) => (
            <InventoryHoldingRow
              key={row.holding.id}
              entry={row.holding}
              variant="stored"
              locationLabel={row.locationLabel}
              onSelectDetail={onSelectDetail}
              onSelectEquip={null}
              onUnequip={onUnequip}
              unequippingId={unequippingId}
              equippingId={equippingId}
              readOnly={readOnly}
              vehicleNamesById={vehicleNamesById}
            />
          ))}
        </ul>
      ) : null}
      {layout.drawers.length > 0 ? (
        <div
          className={
            layout.vehicleRows.length > 0 ? "mt-4 space-y-4" : "mt-3 space-y-4"
          }
        >
          {layout.drawers.map((drawer) => {
            const panelId = `stored-drawer-${characterId}-${encodeURIComponent(drawer.storageKey)}`;
            return (
              <section key={drawer.storageKey}>
                <StoredDrawerHeading
                  heading={drawer.heading}
                  open={drawer.open}
                  holdingCount={drawer.holdingCount}
                  panelId={panelId}
                  onToggleOpen={() =>
                    onToggleDrawer(drawer.storageKey, !drawer.open)
                  }
                />
                {drawer.open ? (
                  <ul id={panelId} className="divide-y divide-black">
                    {drawer.holdings.map((entry) => (
                      <InventoryHoldingRow
                        key={entry.id}
                        entry={entry}
                        variant="stored"
                        onSelectDetail={onSelectDetail}
                        onSelectEquip={null}
                        onUnequip={onUnequip}
                        unequippingId={unequippingId}
                        equippingId={equippingId}
                        readOnly={readOnly}
                        vehicleNamesById={vehicleNamesById}
                      />
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function StoredDrawerHeading({
  heading,
  open,
  holdingCount,
  panelId,
  onToggleOpen,
}: {
  heading: string;
  open: boolean;
  holdingCount: number;
  panelId: string;
  onToggleOpen: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="lightChevronExpand"
        fullWidth={false}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={
          open ? `Collapse ${heading}` : `Expand ${heading}, ${holdingCount}`
        }
        onClick={onToggleOpen}
      >
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
      </Button>
      <h3 className="text-sm font-semibold text-black">
        {heading}
        {open ? null : (
          <span className="ml-2 font-medium text-black/60">{holdingCount}</span>
        )}
      </h3>
    </div>
  );
}
