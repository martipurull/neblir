"use client";

import {
  ITEM_LOCATION_CARRIED,
  isItemCarried,
} from "@/app/lib/constants/inventory";
import {
  deleteCharacterInventoryEntry,
  transferInventoryItem,
  updateCharacterInventoryEntry,
} from "@/lib/api/items";
import ImageLoadingSkeleton from "@/app/components/shared/ImageLoadingSkeleton";
import type { SelectDropdownOption } from "@/app/components/shared/SelectDropdown";
import { useImageUrls } from "@/hooks/use-image-urls";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { ItemDamageRollModal } from "./itemDetailModal/ItemDamageRollModal";
import { ItemDetailExtraWeaponGrid } from "./itemDetailModal/ItemDetailExtraWeaponGrid";
import { ItemDetailGiveRemoveSection } from "./itemDetailModal/ItemDetailGiveRemoveSection";
import { ItemDetailLocationSection } from "./itemDetailModal/ItemDetailLocationSection";
import { ItemDetailSummaryGrid } from "./itemDetailModal/ItemDetailSummaryGrid";
import { ItemDetailUsesSection } from "./itemDetailModal/ItemDetailUsesSection";
import type { ItemDetailModalProps } from "./itemDetailModal/types";
import { useInventoryUses } from "./itemDetailModal/useInventoryUses";
import {
  getWeaponDamage,
  hasExtraWeaponCombatStats,
} from "./itemDetailModal/weaponDerived";

export type { ItemDetailModalProps } from "./itemDetailModal/types";

export function ItemDetailModal({
  isOpen,
  onClose,
  entry,
  characterId,
  gameId,
  mutate,
  resolveGiveRecipients,
}: ItemDetailModalProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [giveOpen, setGiveOpen] = useState(false);
  const [giveQuantity, setGiveQuantity] = useState(1);
  const [recipientId, setRecipientId] = useState("");
  const [recipientOptions, setRecipientOptions] = useState<
    SelectDropdownOption[]
  >([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipientsError, setRecipientsError] = useState<string | null>(null);
  const [giveSubmitting, setGiveSubmitting] = useState(false);
  const [giveError, setGiveError] = useState<string | null>(null);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [leaveLocationInput, setLeaveLocationInput] = useState("");
  const [damageRollOpen, setDamageRollOpen] = useState(false);

  const { maxUses, displayUses, updateUses } = useInventoryUses({
    entry,
    characterId,
    mutate,
  });

  useEffect(() => {
    if (!isOpen) {
      setGiveOpen(false);
      setRemoveConfirmOpen(false);
      setRecipientId("");
      setRecipientOptions([]);
      setRecipientsError(null);
      setGiveError(null);
      setGiveQuantity(1);
      setDamageRollOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!giveOpen || !resolveGiveRecipients) return;
    setRecipientsLoading(true);
    setRecipientsError(null);
    void resolveGiveRecipients(entry)
      .then((opts) => {
        setRecipientOptions(opts);
        setRecipientId("");
      })
      .catch((e: unknown) => {
        setRecipientOptions([]);
        setRecipientsError(
          getUserSafeErrorMessage(e, "Could not load characters")
        );
      })
      .finally(() => setRecipientsLoading(false));
  }, [giveOpen, resolveGiveRecipients, entry]);

  useEffect(() => {
    setGiveQuantity((q) => Math.min(Math.max(1, q), entry.quantity));
  }, [entry.quantity, entry.id]);

  const carried = isItemCarried(entry);
  const displayLocation = carried ? "On hand" : (entry.itemLocation ?? "—");

  const itemImageKey =
    entry.item && "imageKey" in entry.item
      ? (entry.item as { imageKey?: string | null }).imageKey
      : null;
  const imageEntries = useMemo(
    () =>
      itemImageKey ? [{ id: `item-${entry.id}`, imageKey: itemImageKey }] : [],
    [entry.id, itemImageKey]
  );
  const imageUrls = useImageUrls(imageEntries);
  const itemImageUrl = itemImageKey ? imageUrls[`item-${entry.id}`] : null;

  const handleSetLocation = async (itemLocation: string) => {
    setLocationError(null);
    setIsSettingLocation(true);
    try {
      await updateCharacterInventoryEntry(characterId, entry.id, {
        action: "setLocation",
        itemLocation,
      });
      await mutate();
      setLeaveLocationInput("");
    } catch (e) {
      setLocationError(getUserSafeErrorMessage(e, "Failed to update location"));
    } finally {
      setIsSettingLocation(false);
    }
  };

  const handleRemove = async () => {
    setRemoveError(null);
    setIsRemoving(true);
    try {
      await deleteCharacterInventoryEntry(characterId, entry.id);
      await mutate();
      onClose();
    } catch (e) {
      setRemoveError(getUserSafeErrorMessage(e, "Failed to remove item"));
    } finally {
      setIsRemoving(false);
    }
  };

  const handleGiveConfirm = async () => {
    if (!recipientId) {
      setGiveError("Choose a character to give the item to.");
      return;
    }
    setGiveError(null);
    setGiveSubmitting(true);
    try {
      await transferInventoryItem(characterId, entry.id, {
        toCharacterId: recipientId,
        quantity: giveQuantity,
      });
      await mutate();
      setGiveOpen(false);
      onClose();
    } catch (e) {
      setGiveError(getUserSafeErrorMessage(e, "Failed to give item"));
    } finally {
      setGiveSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const name = entry.customName ?? entry.item?.name ?? "Unknown item";
  const item = entry.item;
  const isWeapon = item?.type === "WEAPON";
  const weaponDamage = getWeaponDamage(item ?? undefined);
  const hasRangeAtkBonus = isWeapon && item?.attackRangeBonus != null;
  const showExtraWeaponGrid =
    item != null && isWeapon && hasExtraWeaponCombatStats(item);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-detail-modal-title"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-lg border-2 border-white bg-modalBackground-200 p-5 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h2
              id="item-detail-modal-title"
              className="text-lg font-semibold text-white"
            >
              Item details
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-white transition-colors hover:bg-paleBlue/10"
              aria-label="Close"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span className="text-white/60 uppercase tracking-wider">
                  Name
                </span>
                <p className="mt-0.5 text-white">{name}</p>
              </div>
              {itemImageKey ? (
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg mr-4">
                  {itemImageUrl ? (
                    <Image
                      src={itemImageUrl}
                      alt=""
                      width={80}
                      height={80}
                      className="h-20 w-20 object-cover object-center"
                      unoptimized
                    />
                  ) : itemImageUrl === undefined ? (
                    <ImageLoadingSkeleton variant="item" />
                  ) : null}
                </div>
              ) : null}
            </div>
            {item?.description && (
              <div>
                <span className="text-white/60 uppercase tracking-wider">
                  Description
                </span>
                <p className="mt-0.5 text-white whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            )}
            {item && "usage" in item && item.usage && (
              <div>
                <span className="text-white/60 uppercase tracking-wider">
                  Usage
                </span>
                <p className="mt-0.5 text-white">{item.usage}</p>
              </div>
            )}

            <ItemDetailSummaryGrid
              entry={entry}
              item={item ?? undefined}
              displayLocation={displayLocation}
              isWeapon={isWeapon}
              hasRangeAtkBonus={hasRangeAtkBonus}
              weaponDamage={weaponDamage}
              onOpenDamageRoll={() => setDamageRollOpen(true)}
            />

            {maxUses != null && (
              <ItemDetailUsesSection
                displayUses={displayUses}
                maxUses={maxUses}
                onDelta={updateUses}
              />
            )}

            <ItemDetailLocationSection
              carried={carried}
              leaveLocationInput={leaveLocationInput}
              onLeaveInputChange={setLeaveLocationInput}
              onLeaveSomewhere={() => {
                const loc = leaveLocationInput.trim();
                if (loc) void handleSetLocation(loc);
              }}
              onTakeWithYou={() =>
                void handleSetLocation(ITEM_LOCATION_CARRIED)
              }
              isSettingLocation={isSettingLocation}
              locationError={locationError}
            />

            {showExtraWeaponGrid && item && (
              <ItemDetailExtraWeaponGrid item={item} />
            )}

            {item?.notes && (
              <div>
                <span className="text-white/60 uppercase tracking-wider">
                  Notes
                </span>
                <p className="mt-0.5 text-white whitespace-pre-wrap">
                  {item.notes}
                </p>
              </div>
            )}

            <ItemDetailGiveRemoveSection
              showGiveFlow={Boolean(resolveGiveRecipients)}
              entry={entry}
              itemName={name}
              giveOpen={giveOpen}
              giveQuantity={giveQuantity}
              onGiveQuantityChange={setGiveQuantity}
              recipientId={recipientId}
              onRecipientIdChange={setRecipientId}
              recipientOptions={recipientOptions}
              recipientsLoading={recipientsLoading}
              recipientsError={recipientsError}
              giveError={giveError}
              giveSubmitting={giveSubmitting}
              onGiveConfirm={() => void handleGiveConfirm()}
              removeConfirmOpen={removeConfirmOpen}
              isRemoving={isRemoving}
              removeError={removeError}
              onGiveOpen={() => {
                setGiveOpen(true);
                setRemoveConfirmOpen(false);
                setRemoveError(null);
              }}
              onGiveCancel={() => {
                setGiveOpen(false);
                setGiveError(null);
              }}
              onRemoveConfirmOpen={() => {
                setRemoveConfirmOpen(true);
                setGiveOpen(false);
                setGiveError(null);
                setRemoveError(null);
              }}
              onRemoveConfirmCancel={() => {
                setRemoveConfirmOpen(false);
                setRemoveError(null);
              }}
              onRemoveConfirm={() => void handleRemove()}
            />
          </div>
        </div>
      </div>

      {weaponDamage && (
        <ItemDamageRollModal
          isOpen={damageRollOpen}
          onClose={() => setDamageRollOpen(false)}
          damage={weaponDamage}
          gameId={gameId}
          characterId={characterId}
        />
      )}
    </>
  );
}
