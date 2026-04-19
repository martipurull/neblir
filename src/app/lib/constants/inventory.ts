/** Value for itemLocation when the character has the item on them */
export const ITEM_LOCATION_CARRIED = "carried" as const;

/** True when the entry is carried (on hand) or itemLocation is missing (legacy) */
export function isItemCarried(entry: {
  itemLocation?: string | null;
}): boolean {
  return (
    entry.itemLocation === ITEM_LOCATION_CARRIED || entry.itemLocation == null
  );
}

/** Filter inventory to only carried items */
export function getCarriedInventory<T extends { itemLocation?: string | null }>(
  inventory: T[] | undefined
): T[] {
  if (!inventory?.length) return [];
  return inventory.filter(isItemCarried);
}

/** Same label as inventory lists: custom name, then template name. */
export function getInventoryEntryDisplayName(entry: {
  customName?: string | null;
  item?: { name?: string | null } | null;
}): string {
  const label =
    entry.customName?.trim() ?? entry.item?.name?.trim() ?? "Unknown item";
  return label;
}

/** Alphabetical order aligned with AddItemToInventoryModal browse list. */
export function compareInventoryEntriesAlphabetically<
  T extends {
    id: string;
    customName?: string | null;
    item?: { name?: string | null } | null;
  },
>(a: T, b: T): number {
  const byName = getInventoryEntryDisplayName(a).localeCompare(
    getInventoryEntryDisplayName(b),
    undefined,
    { sensitivity: "base" }
  );
  if (byName !== 0) return byName;
  return a.id.localeCompare(b.id);
}

export function sortInventoryEntriesAlphabetically<
  T extends {
    id: string;
    customName?: string | null;
    item?: { name?: string | null } | null;
  },
>(entries: T[]): T[] {
  return [...entries].sort(compareInventoryEntriesAlphabetically);
}
