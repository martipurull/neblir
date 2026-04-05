"use client";

import { BrowseItemDetailModal } from "@/app/components/character/BrowseItemDetailModal";
import ErrorState from "@/app/components/shared/ErrorState";
import ImageLoadingSkeleton from "@/app/components/shared/ImageLoadingSkeleton";
import InfoCard from "@/app/components/shared/InfoCard";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import { useGame } from "@/hooks/use-game";
import { useImageUrls } from "@/hooks/use-image-urls";
import { getGameCustomItemById } from "@/lib/api/customItems";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import type { ItemBrowseDetailFields } from "@/app/lib/types/itemBrowseDetail";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useMemo, useState } from "react";

function formatItemType(t: string): string {
  if (t === "GENERAL_ITEM") return "General item";
  if (t === "WEAPON") return "Weapon";
  return t;
}

export default function GameCustomItemsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { game, loading, error, refetch } = useGame(id);
  const [search, setSearch] = useState("");
  const [detailItem, setDetailItem] = useState<ItemBrowseDetailFields | null>(
    null
  );
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [openingItemId, setOpeningItemId] = useState<string | null>(null);
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null);

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
      const desc = (item.description ?? "").toLowerCase();
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

  const openItemDetail = async (gameId: string, itemId: string) => {
    setDetailLoadError(null);
    setOpeningItemId(itemId);
    try {
      const full = await getGameCustomItemById(gameId, itemId);
      setDetailItem(full);
      setDetailModalOpen(true);
    } catch (e) {
      setDetailLoadError(
        getUserSafeErrorMessage(e, "Failed to load item details")
      );
    } finally {
      setOpeningItemId(null);
    }
  };

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
  const isGameMaster = game.isGameMaster === true;
  const hasResults = filteredItems.length > 0;

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
            <input
              id="custom-items-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, type, or description"
              className="w-full rounded-md border border-black/15 bg-paleBlue px-3 py-2 text-sm text-black placeholder:text-black/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-black sm:max-w-sm"
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
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={opening}
                      onClick={() => void openItemDetail(game.id, item.id)}
                      className={`flex w-full items-stretch rounded-md border border-black/10 bg-paleBlue/40 px-3 py-2 text-left text-sm text-black transition-colors hover:bg-paleBlue/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:cursor-wait disabled:opacity-70 ${item.imageKey ? "gap-3" : ""}`}
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
                        {item.description?.trim() ? (
                          <p
                            className="mt-1 line-clamp-3 break-words text-xs leading-snug text-black/65"
                            title={item.description}
                          >
                            {item.description}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs italic leading-snug text-black/45">
                            No description
                          </p>
                        )}
                      </div>
                    </button>
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

      <BrowseItemDetailModal
        isOpen={detailModalOpen && detailItem != null}
        item={detailItem}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailItem(null);
        }}
      />
    </PageSection>
  );
}
