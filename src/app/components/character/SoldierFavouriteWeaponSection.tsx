"use client";

import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { StoredRichTextHtml } from "@/app/components/shared/StoredRichTextHtml";
import type { Path } from "@/app/lib/types/path";
import { updateCharacterFavouriteWeapon } from "@/lib/api/character";
import { getItems } from "@/lib/api/items";
import { useImageUrls } from "@/hooks/use-image-urls";
import { PathName } from "@prisma/client";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import type { KeyedMutator } from "swr";
import type { CharacterDetail } from "@/app/lib/types/character";
import { useCallback, useEffect, useMemo, useState } from "react";

const SOLDIER_FAVOURITE_WEAPON_REMINDER =
  "With this favourite weapon, you can make two Attacks using only one Action. This is a reminder only—it does not depend on having the weapon in your inventory.";

export interface SoldierFavouriteWeaponSectionProps {
  path: Path;
  characterId: string;
  readOnly?: boolean;
  mutate?: KeyedMutator<CharacterDetail | null>;
}

export function SoldierFavouriteWeaponSection({
  path,
  characterId,
  readOnly = false,
  mutate,
}: SoldierFavouriteWeaponSectionProps) {
  const isSoldier = path.name === PathName.SOLDIER;

  const [weaponOptions, setWeaponOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedId = path.favouriteWeaponItemId ?? "";
  const favouriteWeapon = path.favouriteWeapon ?? null;

  useEffect(() => {
    if (!isSoldier) {
      return;
    }
    let cancelled = false;
    setOptionsLoading(true);
    setOptionsError(null);
    void getItems()
      .then((items) => {
        if (cancelled) return;
        const weapons = items
          .filter((item) => item.type === "WEAPON")
          .map((item) => ({ value: item.id, label: item.name }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setWeaponOptions(weapons);
      })
      .catch(() => {
        if (!cancelled) {
          setOptionsError("Could not load weapon catalogue.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setOptionsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isSoldier]);

  const imageEntries = useMemo(
    () =>
      favouriteWeapon?.imageKey
        ? [
            {
              id: `soldier-fav-${favouriteWeapon.id}`,
              imageKey: favouriteWeapon.imageKey,
            },
          ]
        : [],
    [favouriteWeapon]
  );
  const imageUrls = useImageUrls(imageEntries);
  const imageUrl = favouriteWeapon
    ? imageUrls[`soldier-fav-${favouriteWeapon.id}`]
    : undefined;

  const handleSelect = useCallback(
    async (value: string) => {
      if (readOnly || !mutate || value === selectedId) {
        return;
      }
      setSaving(true);
      try {
        await mutate(
          async (prev) => {
            if (!prev) return prev;
            return updateCharacterFavouriteWeapon(characterId, {
              pathId: path.id,
              favouriteWeaponItemId: value === "" ? null : value,
            });
          },
          { revalidate: false }
        );
      } catch {
        // prior data retained by SWR
      } finally {
        setSaving(false);
      }
    },
    [characterId, mutate, path.id, readOnly, selectedId]
  );

  if (!isSoldier) {
    return null;
  }

  return (
    <div className="mt-3 border-t border-black/15 pt-3">
      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-black/55">
        Favourite weapon
      </p>
      <p className="mt-1 text-xs leading-snug text-black/70">
        {SOLDIER_FAVOURITE_WEAPON_REMINDER}
      </p>

      {!readOnly && mutate ? (
        <div className="mt-3">
          {optionsError ? (
            <p className="text-sm text-neblirDanger-600">{optionsError}</p>
          ) : (
            <SelectDropdown
              id={`soldier-favourite-weapon-${path.id}`}
              label="Catalogue weapon"
              showLabel={false}
              placeholder={
                optionsLoading ? "Loading weapons…" : "Select a weapon"
              }
              value={selectedId}
              options={weaponOptions}
              disabled={optionsLoading || saving}
              onChange={(value) => {
                void handleSelect(value);
              }}
            />
          )}
        </div>
      ) : null}

      {favouriteWeapon ? (
        <div className="mt-3 flex gap-3 rounded-md border border-black/15 bg-paleBlue/15 p-3">
          {favouriteWeapon.imageKey ? (
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-black/10 bg-paleBlue/30">
              {imageUrl ? (
                <SignedRemoteImage
                  src={imageUrl}
                  imageKey={favouriteWeapon.imageKey ?? undefined}
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 object-cover object-center"
                />
              ) : imageUrl === undefined ? (
                <ImageLoadingSkeleton
                  variant="item"
                  className="h-full w-full"
                />
              ) : null}
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-black">{favouriteWeapon.name}</p>
            <StoredRichTextHtml
              content={favouriteWeapon.description}
              className="mt-1 text-sm leading-snug text-black/85"
            />
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-black/55">
          {readOnly
            ? "No favourite weapon chosen."
            : "Choose a catalogue weapon above to remember your Soldier favourite."}
        </p>
      )}
    </div>
  );
}
