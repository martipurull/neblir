"use client";

import { BrowseItemDetailModal } from "@/app/components/items/BrowseItemDetailModal";
import { CreateCustomItemModal } from "@/app/components/games/CreateCustomItemModal";
import { CreateUniqueItemModal } from "@/app/components/games/CreateUniqueItemModal";
import { GiveItemToCharacterModal } from "@/app/components/games/GiveItemToCharacterModal";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { Button } from "@/app/components/shared/Button";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { PageSection } from "@/app/components/shared/PageSection";
import { PageTitle } from "@/app/components/shared/PageTitle";
import { TextField } from "@/app/components/shared/TextField";
import { richTextToPlainTextPreview } from "@/app/lib/tiptap/richTextPlainTextPreview";
import { useGame } from "@/hooks/use-game";
import { useImageUrls } from "@/hooks/use-image-urls";
import { getGameCustomItemById } from "@/lib/api/customItems";
import {
  getGameUniqueItems,
  getUniqueItemById,
  type UniqueItemListItem,
} from "@/lib/api/uniqueItems";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import type { ItemBrowseDetailFields } from "@/app/lib/types/itemBrowseDetail";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

function formatItemType(t: string): string {
  if (t === "GENERAL_ITEM") return "General item";
  if (t === "WEAPON") return "Weapon";
  return t;
}

function resolvedUniqueToBrowseDetail(
  uniqueItemId: string,
  resolved: Record<string, unknown>
): ItemBrowseDetailFields {
  return {
    id: uniqueItemId,
    name: String(resolved.name ?? "Unknown item"),
    type: resolved.type === "WEAPON" ? "WEAPON" : "GENERAL_ITEM",
    imageKey: (resolved.imageKey as string | null | undefined) ?? null,
    description: (resolved.description as string | null | undefined) ?? null,
    weight: typeof resolved.weight === "number" ? resolved.weight : null,
    confCost: typeof resolved.confCost === "number" ? resolved.confCost : null,
    costInfo: (resolved.costInfo as string | null | undefined) ?? null,
    maxUses: (resolved.maxUses as number | null | undefined) ?? null,
    equippable: (resolved.equippable as boolean | null | undefined) ?? null,
    equipSlotTypes:
      (resolved.equipSlotTypes as string[] | null | undefined) ?? null,
    equipSlotCost:
      (resolved.equipSlotCost as number | null | undefined) ?? null,
    attackRoll: (resolved.attackRoll as string[] | null | undefined) ?? null,
    attackMeleeBonus:
      (resolved.attackMeleeBonus as number | null | undefined) ?? null,
    attackRangeBonus:
      (resolved.attackRangeBonus as number | null | undefined) ?? null,
    attackThrowBonus:
      (resolved.attackThrowBonus as number | null | undefined) ?? null,
    defenceMeleeBonus:
      (resolved.defenceMeleeBonus as number | null | undefined) ?? null,
    defenceRangeBonus:
      (resolved.defenceRangeBonus as number | null | undefined) ?? null,
    gridAttackBonus:
      (resolved.gridAttackBonus as number | null | undefined) ?? null,
    gridDefenceBonus:
      (resolved.gridDefenceBonus as number | null | undefined) ?? null,
    effectiveRange:
      (resolved.effectiveRange as number | null | undefined) ?? null,
    maxRange: (resolved.maxRange as number | null | undefined) ?? null,
    damage:
      (resolved.damage as
        | ItemBrowseDetailFields["damage"]
        | null
        | undefined) ?? null,
    usage: (resolved.usage as string | null | undefined) ?? null,
    notes: (resolved.notes as string | null | undefined) ?? null,
    modifiesAttribute:
      (resolved.modifiesAttribute as ItemBrowseDetailFields["modifiesAttribute"]) ??
      null,
    attributeMod: (resolved.attributeMod as number | null | undefined) ?? null,
    modifiesSkill:
      (resolved.modifiesSkill as ItemBrowseDetailFields["modifiesSkill"]) ??
      null,
    skillMod: (resolved.skillMod as number | null | undefined) ?? null,
  };
}

export default function GameCustomItemsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { game, loading, error, refetch, mutate } = useGame(id);
  const [search, setSearch] = useState("");
  const [uniqueSearch, setUniqueSearch] = useState("");
  const [detailItem, setDetailItem] = useState<ItemBrowseDetailFields | null>(
    null
  );
  const [detailKind, setDetailKind] = useState<"custom" | "unique">("custom");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [openingItemId, setOpeningItemId] = useState<string | null>(null);
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null);
  const [giveItemModalOpen, setGiveItemModalOpen] = useState(false);
  const [editCustomItemId, setEditCustomItemId] = useState<string | null>(null);
  const [editUniqueItemId, setEditUniqueItemId] = useState<string | null>(null);
  const [uniqueItems, setUniqueItems] = useState<UniqueItemListItem[]>([]);
  const [loadingUniqueItems, setLoadingUniqueItems] = useState(false);

  const loadUniqueItems = useCallback(async (gameId: string) => {
    setLoadingUniqueItems(true);
    try {
      const items = await getGameUniqueItems(gameId);
      setUniqueItems(items);
    } catch {
      setUniqueItems([]);
    } finally {
      setLoadingUniqueItems(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    void loadUniqueItems(id);
  }, [id, loadUniqueItems]);

  const customItemsSorted = useMemo(() => {
    if (!game?.customItems) return [];
    return [...game.customItems].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [game?.customItems]);

  const searchTerm = search.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    if (!searchTerm) return customItemsSorted;
    return customItemsSorted.filter((item) => {
      const name = item.name.toLowerCase();
      const type = item.type.toLowerCase();
      const desc =
        richTextToPlainTextPreview(item.description)?.toLowerCase() ?? "";
      return (
        name.includes(searchTerm) ||
        type.includes(searchTerm) ||
        desc.includes(searchTerm)
      );
    });
  }, [customItemsSorted, searchTerm]);

  const imageEntries = useMemo(
    () =>
      filteredItems
        .filter((item): item is typeof item & { imageKey: string } =>
          Boolean(item.imageKey)
        )
        .map((item) => ({ id: item.id, imageKey: item.imageKey })),
    [filteredItems]
  );
  const imageUrls = useImageUrls(imageEntries);

  const openCustomItemDetail = async (gameId: string, itemId: string) => {
    setDetailLoadError(null);
    setOpeningItemId(itemId);
    try {
      const full = await getGameCustomItemById(gameId, itemId);
      setDetailItem(full);
      setDetailKind("custom");
      setDetailModalOpen(true);
    } catch (e) {
      setDetailLoadError(
        getUserSafeErrorMessage(e, "Failed to load item details")
      );
    } finally {
      setOpeningItemId(null);
    }
  };

  const openUniqueItemDetail = async (uniqueItemId: string) => {
    setDetailLoadError(null);
    setOpeningItemId(uniqueItemId);
    try {
      const record = await getUniqueItemById(uniqueItemId);
      const resolved = record.resolvedItem;
      if (!resolved || typeof resolved !== "object") {
        throw new Error("Unique item details are unavailable.");
      }
      setDetailItem(
        resolvedUniqueToBrowseDetail(
          uniqueItemId,
          resolved as Record<string, unknown>
        )
      );
      setDetailKind("unique");
      setDetailModalOpen(true);
    } catch (e) {
      setDetailLoadError(
        getUserSafeErrorMessage(e, "Failed to load unique item details")
      );
    } finally {
      setOpeningItemId(null);
    }
  };

  const uniqueItemsSorted = useMemo(
    () =>
      [...uniqueItems].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      ),
    [uniqueItems]
  );

  const uniqueSearchTerm = uniqueSearch.trim().toLowerCase();
  const filteredUniqueItems = useMemo(() => {
    if (!uniqueSearchTerm) return uniqueItemsSorted;
    return uniqueItemsSorted.filter((item) =>
      item.name.toLowerCase().includes(uniqueSearchTerm)
    );
  }, [uniqueItemsSorted, uniqueSearchTerm]);

  if (loading || (!game && !error)) {
    return (
      <PageSection>
        <LoadingState text="Loading game..." />
      </PageSection>
    );
  }

  if (error || !game) {
    return (
      <PageSection>
        <ErrorState
          message={error ?? "Game not found"}
          onRetry={refetch}
          retryLabel="Retry"
        />
      </PageSection>
    );
  }

  const hasItems = customItemsSorted.length > 0;
  const hasUniqueItems = uniqueItemsSorted.length > 0;
  const isGameMaster = game.isGameMaster === true;
  const hasResults = filteredItems.length > 0;
  const hasUniqueResults = filteredUniqueItems.length > 0;
  const canEditDetail =
    detailKind === "custom" ? isGameMaster : detailKind === "unique";

  return (
    <PageSection>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="mb-4">
          <PageTitle>Custom items</PageTitle>
          <p className="mt-1 text-sm text-black/70">
            Custom and unique items for{" "}
            <span className="font-semibold">{game.name}</span>
          </p>
        </div>
        {isGameMaster && (
          <Link
            href={`/home/games/${game.id}/custom-items/create`}
            className="inline-flex items-center justify-center rounded-md border border-black bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            Create custom item
          </Link>
        )}
      </div>

      {detailLoadError && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {detailLoadError}
        </p>
      )}

      <InfoCard border={false} className="mt-4">
        {hasItems && (
          <div className="mb-3">
            <label htmlFor="custom-items-search" className="sr-only">
              Search custom items
            </label>
            <TextField
              id="custom-items-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, type, or description"
              className="text-sm sm:max-w-sm"
            />
          </div>
        )}
        {hasItems ? (
          hasResults ? (
            <ul className="space-y-2">
              {filteredItems.map((item) => {
                const imageUrl = item.imageKey
                  ? (imageUrls[item.id] ?? undefined)
                  : null;
                const opening = openingItemId === item.id;
                const descPreview = richTextToPlainTextPreview(
                  item.description
                );
                return (
                  <li key={item.id}>
                    <Button
                      type="button"
                      variant="lightBrowseRow"
                      fullWidth={false}
                      className={`w-full ${item.imageKey ? "gap-3" : ""}`}
                      disabled={opening}
                      onClick={() =>
                        void openCustomItemDetail(game.id, item.id)
                      }
                    >
                      {item.imageKey ? (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-transparent">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt=""
                              width={56}
                              height={56}
                              className="h-14 w-14 object-cover object-center"
                              unoptimized
                            />
                          ) : imageUrl === undefined ? (
                            <ImageLoadingSkeleton
                              variant="item"
                              className="!bg-transparent"
                            />
                          ) : null}
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                          <span className="font-semibold">{item.name}</span>
                          <span className="shrink-0 text-xs text-black/55">
                            {formatItemType(item.type)}
                          </span>
                        </div>
                        {descPreview ? (
                          <p
                            className="mt-1 line-clamp-3 break-words text-xs leading-snug text-black/65"
                            title={descPreview}
                          >
                            {descPreview}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs italic leading-snug text-black/45">
                            No description
                          </p>
                        )}
                      </div>
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-4 text-sm text-black/60">
              No custom items match your search.
            </p>
          )
        ) : (
          <p className="py-4 text-sm text-black/60">
            No custom items for this game yet.
          </p>
        )}
      </InfoCard>

      <InfoCard border={false} className="mt-6">
        <h2 className="text-base font-semibold text-black">Unique items</h2>
        <p className="mt-1 text-sm text-black/70">
          Player-owned unique items linked to this game.
        </p>
        {loadingUniqueItems ? (
          <p className="mt-3 text-sm text-black/60">Loading unique items…</p>
        ) : hasUniqueItems ? (
          <>
            <div className="mb-3 mt-3">
              <label htmlFor="unique-items-search" className="sr-only">
                Search unique items
              </label>
              <TextField
                id="unique-items-search"
                type="search"
                value={uniqueSearch}
                onChange={(e) => setUniqueSearch(e.target.value)}
                placeholder="Search unique items by name"
                className="text-sm sm:max-w-sm"
              />
            </div>
            {hasUniqueResults ? (
              <ul className="space-y-2">
                {filteredUniqueItems.map((item) => {
                  const opening = openingItemId === item.id;
                  return (
                    <li key={item.id}>
                      <Button
                        type="button"
                        variant="lightBrowseRow"
                        fullWidth={false}
                        className="w-full"
                        disabled={opening}
                        onClick={() => void openUniqueItemDetail(item.id)}
                      >
                        <div className="min-w-0 flex-1 py-0.5 text-left">
                          <span className="font-semibold">{item.name}</span>
                        </div>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-4 text-sm text-black/60">
                No unique items match your search.
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm text-black/60">
            No unique items for this game yet.
          </p>
        )}
      </InfoCard>

      <BrowseItemDetailModal
        isOpen={detailModalOpen && detailItem != null}
        item={detailItem}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailItem(null);
          setGiveItemModalOpen(false);
        }}
        onGiveToCharacter={
          isGameMaster && detailKind === "custom"
            ? () => setGiveItemModalOpen(true)
            : undefined
        }
        onEdit={
          canEditDetail && detailItem
            ? () => {
                setDetailModalOpen(false);
                setGiveItemModalOpen(false);
                if (detailKind === "custom") {
                  setEditCustomItemId(detailItem.id);
                } else {
                  setEditUniqueItemId(detailItem.id);
                }
              }
            : undefined
        }
      />

      {isGameMaster && detailItem && detailKind === "custom" && (
        <GiveItemToCharacterModal
          isOpen={giveItemModalOpen}
          gameId={game.id}
          game={game}
          lockedItem={{
            sourceType: "CUSTOM_ITEM",
            itemId: detailItem.id,
            itemName: detailItem.name,
          }}
          onClose={() => setGiveItemModalOpen(false)}
          onSuccess={() => {
            setGiveItemModalOpen(false);
            setDetailModalOpen(false);
            setDetailItem(null);
          }}
        />
      )}

      {isGameMaster && editCustomItemId && (
        <CreateCustomItemModal
          isOpen={Boolean(editCustomItemId)}
          gameId={game.id}
          gameName={game.name}
          editCustomItemId={editCustomItemId}
          onClose={() => {
            setEditCustomItemId(null);
          }}
          onSuccess={() => {
            setEditCustomItemId(null);
            setDetailModalOpen(false);
            setDetailItem(null);
            void refetch();
            void mutate();
          }}
        />
      )}

      {editUniqueItemId && (
        <CreateUniqueItemModal
          isOpen={Boolean(editUniqueItemId)}
          customTemplateGameIds={[game.id]}
          gameIdForSubmit={game.id}
          titleSuffix={game.name}
          editUniqueItemId={editUniqueItemId}
          onClose={() => {
            setEditUniqueItemId(null);
          }}
          onSuccess={() => {
            setEditUniqueItemId(null);
            setDetailModalOpen(false);
            setDetailItem(null);
            if (id) void loadUniqueItems(id);
            void refetch();
          }}
        />
      )}
    </PageSection>
  );
}
