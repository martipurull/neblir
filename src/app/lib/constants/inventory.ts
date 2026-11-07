/** Value for itemLocation when the character has the item on them */
export const ITEM_LOCATION_CARRIED = "carried" as const;

/** Stored whereabouts column plus the game recorded for a Stash. */
export type HoldingPlaceWrite = {
  itemLocation: string;
  stashGameId: string | null;
};

/** The pair written whenever a holding changes place. */
export function holdingPlaceWrite(
  place: string,
  stashGameId: string | null
): HoldingPlaceWrite {
  return { itemLocation: place, stashGameId };
}

/** On hand, with no recorded game. */
export function carriedHoldingWrite(): HoldingPlaceWrite {
  return holdingPlaceWrite(ITEM_LOCATION_CARRIED, null);
}

/** In-place stack quantity ceiling on a holding (browse-add may use a lower cap). */
export const MAX_STACK_QUANTITY = 999;

const VEHICLE_CARGO_LOCATION_PREFIX = "vehicle:" as const;
const VEHICLE_MOUNTED_LOCATION_PREFIX = "vehicle-mounted:" as const;
const BOT_INSTALLED_LOCATION_PREFIX = "bot-installed:" as const;
const BOT_CARGO_LOCATION_PREFIX = "bot-cargo:" as const;
const BOT_CARRIED_LOCATION_PREFIX = "bot-carried:" as const;

export type BotPlacement = "installed" | "cargo" | "carried";

export const BOT_ALREADY_ON_BOT_MESSAGE = "That item is already on a bot";

export function botCargoCapacityMessage(maxCargoWeightKg: number): string {
  return `Stowing this item would exceed cargo capacity (${maxCargoWeightKg} kg)`;
}

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

/** True when the whereabouts is vehicle cargo or a mounted item. */
export function isVehicleItemLocation(
  itemLocation: string | null | undefined
): boolean {
  return (
    parseVehicleCargoItemLocation(itemLocation) != null ||
    parseVehicleMountedItemLocation(itemLocation) != null
  );
}

export function botInstalledItemLocation(botCharacterId: string): string {
  return `${BOT_INSTALLED_LOCATION_PREFIX}${botCharacterId}`;
}

export function botCargoItemLocation(botCharacterId: string): string {
  return `${BOT_CARGO_LOCATION_PREFIX}${botCharacterId}`;
}

export function botCarriedItemLocation(botCharacterId: string): string {
  return `${BOT_CARRIED_LOCATION_PREFIX}${botCharacterId}`;
}

export function botItemLocation(
  place: BotPlacement,
  botCharacterId: string
): string {
  if (place === "installed") return botInstalledItemLocation(botCharacterId);
  if (place === "cargo") return botCargoItemLocation(botCharacterId);
  return botCarriedItemLocation(botCharacterId);
}

function parsePrefixedId(
  itemLocation: string | null | undefined,
  prefix: string
): string | null {
  if (!itemLocation?.startsWith(prefix)) return null;
  const id = itemLocation.slice(prefix.length).trim();
  return id.length > 0 ? id : null;
}

/** Parse a bot placement itemLocation; null when the row is not on a bot. */
export function parseBotItemLocation(
  itemLocation: string | null | undefined
): { place: BotPlacement; botCharacterId: string } | null {
  const installed = parsePrefixedId(
    itemLocation,
    BOT_INSTALLED_LOCATION_PREFIX
  );
  if (installed) return { place: "installed", botCharacterId: installed };
  const cargo = parsePrefixedId(itemLocation, BOT_CARGO_LOCATION_PREFIX);
  if (cargo) return { place: "cargo", botCharacterId: cargo };
  const carried = parsePrefixedId(itemLocation, BOT_CARRIED_LOCATION_PREFIX);
  if (carried) return { place: "carried", botCharacterId: carried };
  return null;
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
  /** Map of bot holding id → display name for bot placement labels. */
  botNamesById?: Readonly<Record<string, string>>;
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
  const botPlace = parseBotItemLocation(trimmed);
  if (botPlace) {
    const name = options?.botNamesById?.[botPlace.botCharacterId]?.trim();
    const botName = name && name.length > 0 ? name : "Bot";
    if (botPlace.place === "installed") return `${botName} (installed)`;
    if (botPlace.place === "cargo") return `${botName} cargo`;
    return `${botName} (carried)`;
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
