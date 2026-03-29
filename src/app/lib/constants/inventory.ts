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
