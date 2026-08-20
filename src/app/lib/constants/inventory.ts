/** Value for itemLocation when the character has the item on them */
export const ITEM_LOCATION_CARRIED = "carried" as const;

const VEHICLE_CARGO_LOCATION_PREFIX = "vehicle:" as const;
const VEHICLE_MOUNTED_LOCATION_PREFIX = "vehicle-mounted:" as const;

/** itemLocation value for cargo stowed on a vehicle instance. */
export function vehicleCargoItemLocation(vehicleCharacterId: string): string {
  return `${VEHICLE_CARGO_LOCATION_PREFIX}${vehicleCharacterId}`;
}

/** itemLocation value for an item mounted on a vehicle instance. */
export function vehicleMountedItemLocation(vehicleCharacterId: string): string {
  return `${VEHICLE_MOUNTED_LOCATION_PREFIX}${vehicleCharacterId}`;
}

/** Parse a vehicle cargo itemLocation; null if not a vehicle cargo location. */
export function parseVehicleCargoItemLocation(
  itemLocation: string | null | undefined
): string | null {
  if (!itemLocation?.startsWith(VEHICLE_CARGO_LOCATION_PREFIX)) return null;
  // Avoid matching `vehicle-mounted:` (also starts with `vehicle:`).
  if (itemLocation.startsWith(VEHICLE_MOUNTED_LOCATION_PREFIX)) return null;
  const id = itemLocation.slice(VEHICLE_CARGO_LOCATION_PREFIX.length).trim();
  return id.length > 0 ? id : null;
}

/** Parse a vehicle-mounted itemLocation; null if not a mounted location. */
export function parseVehicleMountedItemLocation(
  itemLocation: string | null | undefined
): string | null {
  if (!itemLocation?.startsWith(VEHICLE_MOUNTED_LOCATION_PREFIX)) return null;
  const id = itemLocation.slice(VEHICLE_MOUNTED_LOCATION_PREFIX.length).trim();
  return id.length > 0 ? id : null;
}

export function isItemInVehicleCargo(
  entry: { itemLocation?: string | null },
  vehicleCharacterId: string
): boolean {
  return (
    parseVehicleCargoItemLocation(entry.itemLocation) === vehicleCharacterId
  );
}

export type FormatItemLocationLabelOptions = {
  /** Map of VehicleCharacter id → display name for vehicle cargo/mount labels. */
  vehicleNamesById?: Readonly<Record<string, string>>;
};

function resolveVehicleLocationName(
  vehicleCharacterId: string,
  options?: FormatItemLocationLabelOptions
): string {
  const name = options?.vehicleNamesById?.[vehicleCharacterId]?.trim();
  return name && name.length > 0 ? name : "Vehicle";
}

/** Human-readable itemLocation for inventory lists (hides raw vehicle ids). */
export function formatItemLocationLabel(
  itemLocation: string | null | undefined,
  options?: FormatItemLocationLabelOptions
): string | null {
  const trimmed = itemLocation?.trim();
  if (!trimmed) return null;
  const mountedId = parseVehicleMountedItemLocation(trimmed);
  if (mountedId) {
    return `${resolveVehicleLocationName(mountedId, options)} (mounted)`;
  }
  const cargoId = parseVehicleCargoItemLocation(trimmed);
  if (cargoId) {
    const name = options?.vehicleNamesById?.[cargoId]?.trim();
    return name && name.length > 0 ? name : "Vehicle cargo";
  }
  return trimmed;
}

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
function getInventoryEntryDisplayName(entry: {
  customName?: string | null;
  item?: { name?: string | null } | null;
}): string {
  const label =
    entry.customName?.trim() ?? entry.item?.name?.trim() ?? "Unknown item";
  return label;
}

/** Alphabetical order aligned with AddItemToInventoryModal browse list. */
function compareInventoryEntriesAlphabetically<
  T extends {
    id?: string | null;
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
  return (a.id ?? "").localeCompare(b.id ?? "");
}

export function sortInventoryEntriesAlphabetically<
  T extends {
    id?: string | null;
    customName?: string | null;
    item?: { name?: string | null } | null;
  },
>(entries: T[]): T[] {
  return [...entries].sort(compareInventoryEntriesAlphabetically);
}
