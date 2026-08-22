"use client";

import { BrowseItemDetailsView } from "@/app/components/items/BrowseItemDetailsView";
import { GiveItemToCharacterModal } from "@/app/components/games/GiveItemToCharacterModal";
import { Button } from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { RemoteThumbnail } from "@/app/components/shared/RemoteThumbnail";
import { TextField } from "@/app/components/shared/TextField";
import {
  itemWithIdToBrowseDetail,
  type ItemBrowseDetailFields,
} from "@/app/lib/types/itemBrowseDetail";
import type { GameDetail } from "@/app/lib/types/game";
import { useImageUrls } from "@/hooks/use-image-urls";
import { getItems, type ItemWithId } from "@/lib/api/items";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useEffect, useMemo, useState } from "react";

type BrowseItemsModalProps = {
  isOpen: boolean;
  gameId: string;
  game: GameDetail;
  gameName: string;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
};

export function BrowseItemsModal(props: BrowseItemsModalProps) {
  if (!props.isOpen) return null;
  return <BrowseItemsModalContent {...props} />;
}

function BrowseItemsModalContent({
  gameId,
  game,
  gameName,
  onClose,
  onSuccess,
}: BrowseItemsModalProps) {
  const [items, setItems] = useState<ItemWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [giveOpen, setGiveOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getItems()
      .then((rows) => {
        if (cancelled) return;
        setItems(rows);
        setSelectedId((curr) => curr || rows[0]?.id || "");
      })
      .catch((e) => {
        if (cancelled) return;
        setError(getUserSafeErrorMessage(e, "Failed to load catalogue items"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...items].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
    if (!q) return sorted;
    return sorted.filter((item) => {
      const haystack = [item.name, item.description ?? "", item.type]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, search]);

  const selectedItem: ItemBrowseDetailFields | null = useMemo(() => {
    const row =
      filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;
    return row ? itemWithIdToBrowseDetail(row) : null;
  }, [filtered, selectedId]);

  const imageUrls = useImageUrls(
    items.map((item) => ({ id: item.id, imageKey: item.imageKey ?? null }))
  );

  return (
    <>
      <ModalShell
        isOpen
        onClose={onClose}
        title={`Browse items — ${gameName}`}
        titleId="browse-items-title"
        maxWidthClass="max-w-4xl"
      >
        <p className="mt-1 text-xs text-white/70">
          Official catalogue items. Give one to a character from here.
        </p>
        <div className="mt-3">
          <TextField
            id="browse-items-search"
            type="search"
            variant="dark"
            density="compact"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            aria-label="Search items"
          />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-[17rem_minmax(0,1fr)]">
          <div className="max-h-[55vh] overflow-y-auto rounded border border-white/20 p-2">
            {loading ? (
              <p className="px-2 py-3 text-sm text-white/75">Loading items…</p>
            ) : filtered.length === 0 ? (
              <p className="px-2 py-3 text-sm text-white/75">No items found.</p>
            ) : (
              <ul className="space-y-1">
                {filtered.map((item) => (
                  <li key={item.id}>
                    <Button
                      type="button"
                      variant={
                        selectedItem?.id === item.id
                          ? "modalBrowseListRowSelected"
                          : "modalBrowseListRow"
                      }
                      fullWidth={false}
                      className="w-full"
                      onClick={() => setSelectedId(item.id)}
                    >
                      <RemoteThumbnail
                        imageUrl={imageUrls[item.id]}
                        imageKey={item.imageKey}
                        alt=""
                        size={32}
                        variant="item"
                        className="h-8 w-8"
                      />
                      <span className="min-w-0 flex-1 truncate text-left">
                        <span className="block truncate font-medium">
                          {item.name}
                        </span>
                        <span className="block truncate text-xs text-white/65">
                          {item.type === "WEAPON" ? "Weapon" : "General"}
                        </span>
                      </span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="max-h-[55vh] overflow-y-auto rounded border border-white/20 p-3">
            {!selectedItem ? (
              <p className="text-sm text-white/75">
                Select an item to view details.
              </p>
            ) : (
              <BrowseItemDetailsView
                key={selectedItem.id}
                item={selectedItem}
                imageKeyPrefix="browse-items"
              />
            )}
          </div>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-neblirDanger-300">{error}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondaryOutlineXs" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            variant="semanticWarningOutline"
            disabled={!selectedItem || loading}
            onClick={() => setGiveOpen(true)}
          >
            Give to character
          </Button>
        </div>
      </ModalShell>

      {selectedItem ? (
        <GiveItemToCharacterModal
          isOpen={giveOpen}
          gameId={gameId}
          game={game}
          lockedItem={{
            sourceType: "GLOBAL_ITEM",
            itemId: selectedItem.id,
            itemName: selectedItem.name,
          }}
          onClose={() => setGiveOpen(false)}
          onSuccess={() => {
            setGiveOpen(false);
            void onSuccess?.();
          }}
        />
      ) : null}
    </>
  );
}
