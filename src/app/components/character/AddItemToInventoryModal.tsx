"use client";

import type { ItemBrowseDetailFields } from "@/app/lib/types/itemBrowseDetail";
import { addItemToCharacterInventory } from "@/lib/api/items";
import type { ItemWithId } from "@/lib/api/items";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import type { KeyedMutator } from "swr";
import type { CharacterDetail } from "@/app/lib/types/character";
import { SafeButton } from "@/app/components/shared/SemanticActionButton";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BrowseItemDetailModal } from "./BrowseItemDetailModal";

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
      const { fetchGameCustomItemsForBrowse } = await import(
        "@/lib/api/customItems"
      );
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
    if (isOpen) {
      setSearchQuery("");
      setAddingKey(null);
      setSelectedRow(null);
      setError(null);
      void fetchItems();
    }
  }, [isOpen, fetchItems]);

  useEffect(() => {
    if (!isOpen) return;
    // Delay to ensure the input is mounted before focusing.
    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = browseRows;
    if (q) {
      list = browseRows.filter((row) => {
        const name = row.item.name.toLowerCase();
        const desc = (row.item.description ?? "").toLowerCase();
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

  const handleAddFromDetail = useCallback(
    async (item: ItemBrowseDetailFields) => {
      if (!selectedRow) return;
      setAddingKey(selectedRow.key);
      try {
        if (selectedRow.source === "GLOBAL") {
          await addItemToCharacterInventory(character.id, {
            sourceType: "GLOBAL_ITEM",
            itemId: item.id,
          });
        } else {
          await addItemToCharacterInventory(character.id, {
            sourceType: "CUSTOM_ITEM",
            itemId: item.id,
          });
        }
        await mutate();
        setSelectedRow(null);
      } catch (e) {
        setError(getUserSafeErrorMessage(e, "Failed to add item"));
      } finally {
        setAddingKey(null);
      }
    },
    [character.id, mutate, selectedRow]
  );

  const handleAdd = useCallback(
    async (row: BrowseInventoryRow) => {
      setAddingKey(row.key);
      try {
        if (row.source === "GLOBAL") {
          await addItemToCharacterInventory(character.id, {
            sourceType: "GLOBAL_ITEM",
            itemId: row.item.id,
          });
        } else {
          await addItemToCharacterInventory(character.id, {
            sourceType: "CUSTOM_ITEM",
            itemId: row.item.id,
          });
        }
        await mutate();
      } catch (e) {
        setError(getUserSafeErrorMessage(e, "Failed to add item"));
      } finally {
        setAddingKey(null);
      }
    },
    [character.id, mutate]
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
        <div className="flex items-center justify-between shrink-0">
          <h2
            id="add-item-modal-title"
            className="text-lg font-semibold text-white"
          >
            Add item to inventory
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white transition-colors hover:bg-white/10"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="mt-4 shrink-0">
          <label htmlFor="add-item-search" className="sr-only">
            Search items
          </label>
          <input
            ref={searchInputRef}
            id="add-item-search"
            type="search"
            placeholder="Search by name, description, or game…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border-2 border-white bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            autoComplete="off"
          />
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
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
                return (
                  <li
                    key={row.key}
                    className="flex items-center gap-3 py-2.5 first:pt-0"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedRow(row)}
                      className="min-w-0 flex-1 text-left hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent rounded"
                    >
                      <p className="text-sm font-medium text-white truncate">
                        {row.item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-white/50">
                        {sourceLabel}
                      </p>
                      {row.item.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-white/70">
                          {row.item.description}
                        </p>
                      ) : null}
                      <p className="mt-0.5 text-xs text-white/50">
                        {row.item.weight != null
                          ? `${row.item.weight} kg`
                          : "—"}
                      </p>
                    </button>
                    <div className="shrink-0">
                      <SafeButton
                        type="button"
                        onClick={() => {
                          void handleAdd(row);
                        }}
                        disabled={isAdding}
                        className="!px-2 !py-1 !text-xs"
                      >
                        {isAdding ? "Adding…" : "Add"}
                      </SafeButton>
                    </div>
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
