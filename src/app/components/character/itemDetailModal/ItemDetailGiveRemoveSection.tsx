"use client";

import {
  DangerButton,
  WarningButton,
} from "@/app/components/shared/SemanticActionButton";
import type { SelectDropdownOption } from "@/app/components/shared/SelectDropdown";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import React from "react";
import type { InventoryEntry } from "./types";
import { innerActionPanelClass } from "./utils";

type ItemDetailGiveRemoveSectionProps = {
  /** When false, only remove controls are shown (e.g. no “give” API on this page). */
  showGiveFlow: boolean;
  entry: InventoryEntry;
  itemName: string;
  giveOpen: boolean;
  onGiveOpen: () => void;
  onGiveCancel: () => void;
  giveQuantity: number;
  onGiveQuantityChange: (n: number) => void;
  recipientId: string;
  onRecipientIdChange: (id: string) => void;
  recipientOptions: SelectDropdownOption[];
  recipientsLoading: boolean;
  recipientsError: string | null;
  giveError: string | null;
  giveSubmitting: boolean;
  onGiveConfirm: () => void;
  removeConfirmOpen: boolean;
  onRemoveConfirmOpen: () => void;
  onRemoveConfirmCancel: () => void;
  onRemoveConfirm: () => void;
  isRemoving: boolean;
  removeError: string | null;
};

export function ItemDetailGiveRemoveSection({
  showGiveFlow,
  entry,
  itemName,
  giveOpen,
  onGiveOpen,
  onGiveCancel,
  giveQuantity,
  onGiveQuantityChange,
  recipientId,
  onRecipientIdChange,
  recipientOptions,
  recipientsLoading,
  recipientsError,
  giveError,
  giveSubmitting,
  onGiveConfirm,
  removeConfirmOpen,
  onRemoveConfirmOpen,
  onRemoveConfirmCancel,
  onRemoveConfirm,
  isRemoving,
  removeError,
}: ItemDetailGiveRemoveSectionProps) {
  return (
    <div className="mt-6 pt-4 border-t border-white/20 space-y-3">
      {showGiveFlow &&
        (!giveOpen ? (
          <WarningButton type="button" onClick={onGiveOpen} className="w-full">
            Give item
          </WarningButton>
        ) : (
          <div className={innerActionPanelClass}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                Give to another character
              </span>
              <button
                type="button"
                onClick={onGiveCancel}
                className="text-xs text-white/80 underline hover:text-white"
              >
                Cancel
              </button>
            </div>
            <div>
              <label
                htmlFor="give-quantity"
                className="mb-1 block text-xs font-bold uppercase tracking-wider text-white/70"
              >
                How many
              </label>
              <input
                id="give-quantity"
                type="number"
                min={1}
                max={entry.quantity}
                value={giveQuantity}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value, 10);
                  if (Number.isNaN(n)) return;
                  onGiveQuantityChange(
                    Math.min(Math.max(1, n), Math.max(1, entry.quantity))
                  );
                }}
                className="w-full rounded border border-white/30 bg-white/5 px-3 py-2 text-sm text-white tabular-nums"
              />
              <p className="mt-1 text-xs text-white/50">
                You have {entry.quantity} in this stack.
              </p>
            </div>
            <div className="rounded-md bg-paleBlue p-3">
              {recipientsLoading ? (
                <p className="text-sm text-black/70">Loading characters…</p>
              ) : recipientsError ? (
                <p className="text-sm text-neblirDanger-600">
                  {recipientsError}
                </p>
              ) : (
                <SelectDropdown
                  id="give-item-recipient"
                  label="Recipient"
                  placeholder="Choose a character…"
                  value={recipientId}
                  options={recipientOptions}
                  disabled={recipientOptions.length === 0}
                  onChange={onRecipientIdChange}
                />
              )}
              {recipientOptions.length === 0 &&
                !recipientsLoading &&
                !recipientsError && (
                  <p className="mt-2 text-xs text-black/60">
                    No eligible characters (link to a game or adjust filters).
                  </p>
                )}
            </div>
            <WarningButton
              type="button"
              onClick={onGiveConfirm}
              disabled={
                giveSubmitting ||
                recipientsLoading ||
                !recipientId ||
                recipientOptions.length === 0
              }
              className="w-full"
            >
              {giveSubmitting ? "Giving…" : "Confirm give"}
            </WarningButton>
            {giveError && (
              <p className="text-sm text-neblirDanger-400">{giveError}</p>
            )}
          </div>
        ))}

      {removeConfirmOpen ? (
        <div className={innerActionPanelClass}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white/70">
              Remove from inventory
            </span>
            <button
              type="button"
              onClick={onRemoveConfirmCancel}
              disabled={isRemoving}
              className="text-xs text-white/80 underline hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
          <p className="text-sm text-white/85">
            Remove <span className="font-medium text-white">{itemName}</span>{" "}
            from this character? This cannot be undone.
          </p>
          <DangerButton
            type="button"
            onClick={onRemoveConfirm}
            disabled={isRemoving}
            className="w-full"
          >
            {isRemoving ? "Removing…" : "Yes, remove"}
          </DangerButton>
          {removeError && (
            <p className="text-sm text-neblirDanger-400">{removeError}</p>
          )}
        </div>
      ) : (
        <DangerButton
          type="button"
          onClick={onRemoveConfirmOpen}
          disabled={isRemoving}
          className="w-full"
        >
          Remove from inventory
        </DangerButton>
      )}
    </div>
  );
}
