// eslint-disable-next-line no-unused-expressions
"use client";

import { addItemToCharacterInventory } from "@/lib/api/items";
import type { ItemWithId } from "@/lib/api/items";
import type { KeyedMutator } from "swr";
import type { CharacterDetail } from "@/app/lib/types/character";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BrowseItemDetailModal } from "./BrowseItemDetailModal";

export interface AddItemToInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterDetail;
  mutate: KeyedMutator<CharacterDetail | null>;
}

function filterItems(items: ItemWithId[], query: string): ItemWithId[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      (item.description ?? "").toLowerCase().includes(q)
  );
}

export function AddItemToInventoryModal({
  isOpen,
  onClose,
  character,
  mutate,
}: AddItemToInventoryModalProps) {
  const [items, setItems] = useState<ItemWithId[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemWithId | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { getItems } = await import("@/lib/api/items");
      const data = await getItems();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setAddingId(null);
      setSelectedItem(null);
      setError(null);
      void fetchItems();
    }
  }, [isOpen, fetchItems]);

  const handleAddFromDetail = useCallback(
    async (item: ItemWithId) => {
      setAddingId(item.id);
      try {
        await addItemToCharacterInventory(character.id, {
          sourceType: "GLOBAL_ITEM",
          itemId: item.id,
        });
        await mutate();
        setSelectedItem(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add item");
      } finally {
        setAddingId(null);
      }
    },
    [character.id, mutate]
  );

  const filteredItems = useMemo(() => {
    const filtered = filterItems(items, searchQuery);
    return [...filtered].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [items, searchQuery]);

  const handleAdd = useCallback(
    async (item: ItemWithId) => {
      setAddingId(item.id);
      try {
        await addItemToCharacterInventory(character.id, {
          sourceType: "GLOBAL_ITEM",
          itemId: item.id,
        });
        await mutate();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add item");
      } finally {
        setAddingId(null);
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
            id="add-item-search"
            type="search"
            placeholder="Search by name or description…"
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
          ) : filteredItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/80">
              {items.length === 0
                ? "No items available."
                : "No items match your search."}
            </p>
          ) : (
            <ul className="divide-y divide-white/20">
              {filteredItems.map((item) => {
                const isAdding = addingId === item.id;
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="min-w-0 flex-1 text-left hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent rounded"
                    >
                      <p className="text-sm font-medium text-white truncate">
                        {item.name}
                      </p>
                      {item.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-white/70">
                          {item.description}
                        </p>
                      ) : null}
                      <p className="mt-0.5 text-xs text-white/50">
                        {item.weight != null ? `${item.weight} kg` : "—"}
                      </p>
                    </button>
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          void handleAdd(item);
                        }}
                        disabled={isAdding}
                        className="rounded border border-neblirSafe-200 bg-transparent px-2 py-1 text-xs font-medium text-neblirSafe-400 transition-colors hover:bg-neblirSafe-200/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isAdding ? "Adding…" : "Add"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <BrowseItemDetailModal
        isOpen={selectedItem != null}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        onAddToInventory={handleAddFromDetail}
        isAdding={addingId === selectedItem?.id}
      />
    </div>
  );
}
