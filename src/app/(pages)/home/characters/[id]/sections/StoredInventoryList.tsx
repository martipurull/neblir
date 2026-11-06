"use client";

import type { StashRename } from "@/app/lib/stashPlace";
import { projectStoredInventory } from "@/app/lib/storedInventory";
import type { ItemCharacter } from "@/app/lib/types/character";
import { useMemo } from "react";
import {
  InventoryColumnHeader,
  InventoryHoldingRow,
  type HoldingRowShared,
} from "./InventoryHoldingRow";
import { StashDrawerHeading } from "./StashDrawerHeading";

type StoredInventoryListProps = {
  characterId: string;
  holdings: ItemCharacter[];
  openByKey: Readonly<Record<string, boolean>>;
  onToggleStashDrawer: (stashKey: string, open: boolean) => void;
  onRenameStash?: (rename: StashRename) => Promise<void>;
  renameDisabled?: boolean;
  renameError?: string | null;
  row: HoldingRowShared;
};

export function StoredInventoryList({
  characterId,
  holdings,
  openByKey,
  onToggleStashDrawer,
  onRenameStash,
  renameDisabled = false,
  renameError,
  row,
}: StoredInventoryListProps) {
  const layout = useMemo(
    () =>
      projectStoredInventory(holdings, {
        vehicleNamesById: row.vehicleNamesById,
        openByKey,
      }),
    [holdings, openByKey, row.vehicleNamesById]
  );

  if (layout.vehicleRows.length === 0 && layout.stashDrawers.length === 0) {
    return null;
  }

  const showColumnHeader =
    layout.vehicleRows.length > 0 ||
    layout.stashDrawers.some((stashDrawer) => stashDrawer.open);
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
          {layout.vehicleRows.map((vehicleRow) => (
            <InventoryHoldingRow
              key={vehicleRow.holding.id}
              holding={vehicleRow.holding}
              locationLabel={vehicleRow.locationLabel}
              variant="stored"
              row={row}
            />
          ))}
        </ul>
      ) : null}
      {layout.stashDrawers.length > 0 ? (
        <div
          className={
            layout.vehicleRows.length > 0 ? "mt-4 space-y-4" : "mt-3 space-y-4"
          }
        >
          {renameError ? (
            <p className="text-sm text-neblirDanger-600">{renameError}</p>
          ) : null}
          {layout.stashDrawers.map((stashDrawer) => {
            const panelId = `stash-drawer-${characterId}-${encodeURIComponent(stashDrawer.stashKey)}`;
            return (
              <section key={stashDrawer.stashKey}>
                <StashDrawerHeading
                  heading={stashDrawer.heading}
                  open={stashDrawer.open}
                  holdingCount={stashDrawer.holdingCount}
                  panelId={panelId}
                  disabled={renameDisabled}
                  onToggleOpen={() =>
                    onToggleStashDrawer(stashDrawer.stashKey, !stashDrawer.open)
                  }
                  onRename={onRenameStash}
                />
                {stashDrawer.open ? (
                  <ul id={panelId} className="divide-y divide-black">
                    {stashDrawer.holdings.map((holding) => (
                      <InventoryHoldingRow
                        key={holding.id}
                        holding={holding}
                        variant="stored"
                        row={row}
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
