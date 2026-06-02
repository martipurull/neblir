"use client";

import type { ItemBrowseDetailFields } from "@/app/lib/types/itemBrowseDetail";
import { addItemToCharacterInventory } from "@/lib/api/items";
import type { ItemWithId } from "@/lib/api/items";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import type { KeyedMutator } from "swr";
import type { CharacterDetail } from "@/app/lib/types/character";
import { Button } from "@/app/components/shared/Button";
import { TextField } from "@/app/components/shared/TextField";
import { richTextToPlainTextPreview } from "@/app/lib/tiptap/richTextPlainTextPreview";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowseItemDetailModal } from "@/app/components/items/BrowseItemDetailModal";
import { BrowseRowAddControls } from "./BrowseRowAddControls";

export interface AddItemToInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterDetail;
  mutate: KeyedMutator<CharacterDetail | null>;
}

type BrowseInventoryRow =
  | {
      key: string;
      source: "GLOBAL";
      item: ItemWithId;
    }
  | {
      key: string;
      source: "CUSTOM";
      gameId: string;
      gameName: string;
      item: ItemBrowseDetailFields;
    };

export function AddItemToInventoryModal({
  isOpen,
  onClose,
  character,
  mutate,
}: AddItemToInventoryModalProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const listScrollRef = useRef<HTMLDivElement | null>(null);
  const listScrollTopRef = useRef(0);
  const openSessionStartedRef = useRef(false);
  const [browseRows, setBrowseRows] = useState<BrowseInventoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<BrowseInventoryRow | null>(
    null
  );

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { getItems } = await import("@/lib/api/items");
      const { fetchGameCustomItemsForBrowse } =
        await import("@/lib/api/customItems");
      const { getGameById } = await import("@/lib/api/game");

      const gameIds = [
        ...new Set((character.games ?? []).map((g) => g.gameId)),
      ];

      const [globalItems, customByGame] = await Promise.all([
        getItems(),
        Promise.all(
          gameIds.map(async (gameId) => {
            try {
              const items = await fetchGameCustomItemsForBrowse(gameId);
              let gameName = gameId;
              try {
                const g = await getGameById(gameId);
                gameName = g.name;
              } catch {
                // keep gameId as fallback label
              }
              return { gameId, gameName, items };
            } catch {
              return {
                gameId,
                gameName: gameId,
                items: [] as ItemBrowseDetailFields[],
              };
            }
          })
        ),
      ]);

      const rows: BrowseInventoryRow[] = [
        ...globalItems.map((item) => ({
          key: `global-${item.id}`,
          source: "GLOBAL" as const,
          item,
        })),
        ...customByGame.flatMap(({ gameId, gameName, items }) =>
          items.map((item) => ({
            key: `custom-${gameId}-${item.id}`,
            source: "CUSTOM" as const,
            gameId,
            gameName,
            item,
          }))
        ),
      ];

      setBrowseRows(rows);
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to load items"));
    } finally {
      setLoading(false);
    }
  }, [character.games]);

  useEffect(() => {
    if (!isOpen) {
      openSessionStartedRef.current = false;
      return;
    }
    if (openSessionStartedRef.current) return;
    openSessionStartedRef.current = true;
    setSearchQuery("");
    setAddingKey(null);
    setSelectedRow(null);
    setError(null);
    void fetchItems();
  }, [isOpen, fetchItems]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const restoreListScroll = useCallback(() => {
    const top = listScrollTopRef.current;
    requestAnimationFrame(() => {
      if (listScrollRef.current) {
        listScrollRef.current.scrollTop = top;
      }
    });
  }, []);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = browseRows;
    if (q) {
      list = browseRows.filter((row) => {
        const name = row.item.name.toLowerCase();
        const desc =
          richTextToPlainTextPreview(row.item.description)?.toLowerCase() ?? "";
        const gameLabel =
          row.source === "CUSTOM" ? row.gameName.toLowerCase() : "";
        return name.includes(q) || desc.includes(q) || gameLabel.includes(q);
      });
    }
    return [...list].sort((a, b) =>
      a.item.name.localeCompare(b.item.name, undefined, {
        sensitivity: "base",
      })
    );
  }, [browseRows, searchQuery]);

  const addRowToInventory = useCallback(
    async (row: BrowseInventoryRow, quantity: number) => {
      listScrollTopRef.current = listScrollRef.current?.scrollTop ?? 0;
      setAddingKey(row.key);
      setError(null);
      try {
        if (row.source === "GLOBAL") {
          await addItemToCharacterInventory(character.id, {
            sourceType: "GLOBAL_ITEM",
            itemId: row.item.id,
            quantity,
          });
        } else {
          await addItemToCharacterInventory(character.id, {
            sourceType: "CUSTOM_ITEM",
            itemId: row.item.id,
            quantity,
          });
        }
        await mutate();
        restoreListScroll();
      } catch (e) {
        setError(getUserSafeErrorMessage(e, "Failed to add item"));
      } finally {
        setAddingKey(null);
      }
    },
    [character.id, mutate, restoreListScroll]
  );

  const handleAddFromDetail = useCallback(
    async (item: ItemBrowseDetailFields, quantity: number) => {
      if (!selectedRow) return;
      await addRowToInventory(selectedRow, quantity);
    },
    [addRowToInventory, selectedRow]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-item-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border-2 border-white bg-modalBackground-200 p-5 shadow-lg flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/20 pb-4">
          <h2
            id="add-item-modal-title"
            className="text-lg font-semibold text-white"
          >
            Add item to inventory
          </h2>
          <Button
            type="button"
            variant="modalClose"
            fullWidth={false}
            onClick={onClose}
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </Button>
        </div>

        <div className="mt-4 shrink-0">
          <label htmlFor="add-item-search" className="sr-only">
            Search items
          </label>
          <TextField
            ref={searchInputRef}
            id="add-item-search"
            type="search"
            variant="dark"
            placeholder="Search by name, description, or game…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div
          ref={listScrollRef}
          className="mt-3 min-h-0 flex-1 overflow-y-auto"
        >
          {loading ? (
            <p className="py-6 text-center text-sm text-white/80">
              Loading items…
            </p>
          ) : error ? (
            <p className="py-6 text-center text-sm text-neblirDanger-400">
              {error}
            </p>
          ) : filteredRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/80">
              {browseRows.length === 0
                ? "No items available."
                : "No items match your search."}
            </p>
          ) : (
            <ul className="divide-y divide-white/20">
              {filteredRows.map((row) => {
                const isAdding = addingKey === row.key;
                const sourceLabel =
                  row.source === "GLOBAL" ? "Global" : row.gameName;
                const descPreview = richTextToPlainTextPreview(
                  row.item.description
                );
                return (
                  <li
                    key={row.key}
                    className="flex items-center gap-3 py-2.5 first:pt-0"
                  >
                    <Button
                      type="button"
                      variant="modalListRowHit"
                      fullWidth={false}
                      onClick={() => setSelectedRow(row)}
                      className="min-w-0 flex-1"
                    >
                      <p className="text-sm font-medium text-white truncate">
                        {row.item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-white/50">
                        {sourceLabel}
                      </p>
                      {descPreview ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-white/70">
                          {descPreview}
                        </p>
                      ) : null}
                      <p className="mt-0.5 text-xs text-white/50">
                        {row.item.weight != null
                          ? `${row.item.weight} kg`
                          : "—"}
                      </p>
                    </Button>
                    <BrowseRowAddControls
                      itemName={row.item.name}
                      isAdding={isAdding}
                      disabled={addingKey != null && !isAdding}
                      onAdd={(quantity) => addRowToInventory(row, quantity)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <BrowseItemDetailModal
        isOpen={selectedRow != null}
        onClose={() => setSelectedRow(null)}
        item={selectedRow?.item ?? null}
        onAddToInventory={handleAddFromDetail}
        isAdding={addingKey === selectedRow?.key}
      />
    </div>
  );
}
