"use client";

import { Button } from "@/app/components/shared/Button";
import { TextField } from "@/app/components/shared/TextField";
import { projectStoredInventory } from "@/app/lib/storedInventory";
import type { ItemCharacter } from "@/app/lib/types/character";
import { useMemo, useState } from "react";
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
  onRenameStash?: (from: string, placeName: string) => Promise<void>;
  renameDisabled?: boolean;
  renameError?: string | null;
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
  onRenameStash,
  renameDisabled = false,
  renameError,
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
          {renameError ? (
            <p className="text-sm text-neblirDanger-600">{renameError}</p>
          ) : null}
          {layout.drawers.map((drawer) => {
            const panelId = `stored-drawer-${characterId}-${encodeURIComponent(drawer.storageKey)}`;
            return (
              <section key={drawer.storageKey}>
                <StoredDrawerHeading
                  heading={drawer.heading}
                  open={drawer.open}
                  holdingCount={drawer.holdingCount}
                  panelId={panelId}
                  disabled={renameDisabled}
                  onToggleOpen={() =>
                    onToggleDrawer(drawer.storageKey, !drawer.open)
                  }
                  onRename={onRenameStash}
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
  disabled,
  onToggleOpen,
  onRename,
}: {
  heading: string;
  open: boolean;
  holdingCount: number;
  panelId: string;
  disabled: boolean;
  onToggleOpen: () => void;
  onRename?: (from: string, placeName: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(heading);
  const [saving, setSaving] = useState(false);
  const next = draft.trim();
  const canSave = next !== heading;

  const toggle = (
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
  );

  if (!onRename || !editing) {
    return (
      <div className="flex items-center gap-2">
        {toggle}
        <h3 className="text-sm font-semibold text-black">
          {heading}
          {open ? null : (
            <span className="ml-2 font-medium text-black/60">
              {holdingCount}
            </span>
          )}
        </h3>
        {onRename ? (
          <Button
            type="button"
            variant="lightToolbarCompact"
            fullWidth={false}
            disabled={disabled}
            onClick={() => {
              setDraft(heading);
              setEditing(true);
            }}
          >
            Rename
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave || disabled || saving) return;
        setSaving(true);
        void onRename(heading, draft)
          .then(() => setEditing(false))
          .catch(() => {
            // The inventory section shows the message and leaves this draft open.
          })
          .finally(() => setSaving(false));
      }}
    >
      {toggle}
      <TextField
        value={draft}
        density="compact"
        variant="light"
        disabled={disabled || saving}
        aria-label={`Rename ${heading}`}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setDraft(heading);
          setEditing(false);
        }}
      />
      <Button
        type="submit"
        variant="solidDark"
        fullWidth={false}
        className="shrink-0 text-sm"
        disabled={disabled || saving || !canSave}
      >
        Save
      </Button>
      <Button
        type="button"
        variant="lightToolbarCompact"
        fullWidth={false}
        disabled={disabled || saving}
        onClick={() => {
          setDraft(heading);
          setEditing(false);
        }}
      >
        Cancel
      </Button>
    </form>
  );
}
