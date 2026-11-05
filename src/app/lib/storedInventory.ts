import {
  formatItemLocationLabel,
  isItemCarried,
  parseVehicleCargoItemLocation,
  parseVehicleMountedItemLocation,
  sortInventoryEntriesAlphabetically,
  type FormatItemLocationLabelOptions,
} from "@/app/lib/constants/inventory";
import {
  foldSharedName,
  spellingThatSortsFirst,
} from "@/app/lib/sharedNameFold";

export type StoredInventoryHolding = {
  id?: string | null;
  itemLocation?: string | null;
  customName?: string | null;
  item?: { name?: string | null } | null;
};

export type StoredVehicleRow<T> = {
  holding: T;
  locationLabel: string;
};

export type StoredDrawer<T> = {
  heading: string;
  /** Fold of the place. Open or closed memory for this character uses this key. */
  storageKey: string;
  holdings: T[];
  holdingCount: number;
  open: boolean;
};

export type StoredInventoryLayout<T> = {
  vehicleRows: StoredVehicleRow<T>[];
  drawers: StoredDrawer<T>[];
};

export type StoredDrawerOpenState = Readonly<Record<string, boolean>>;

export type StoredDrawerOpenStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

const SESSION_PREFIX = "neblir:stored-drawer-open:v1:";

function storedDrawerSessionKey(characterId: string): string {
  return `${SESSION_PREFIX}${characterId}`;
}

function isVehicleItemLocation(itemLocation: string): boolean {
  return (
    parseVehicleCargoItemLocation(itemLocation) != null ||
    parseVehicleMountedItemLocation(itemLocation) != null
  );
}

/**
 * Stored section for one character: vehicle cargo and mounted rows, then one
 * drawer per place. Spellings that share a fold are one drawer. The same
 * spelling in two games is one drawer. A drawer with no stored choice is open.
 */
export function projectStoredInventory<T extends StoredInventoryHolding>(
  holdings: readonly T[],
  options?: {
    vehicleNamesById?: FormatItemLocationLabelOptions["vehicleNamesById"];
    openByKey?: StoredDrawerOpenState;
  }
): StoredInventoryLayout<T> {
  const openByKey = options?.openByKey ?? {};
  const labelOptions = { vehicleNamesById: options?.vehicleNamesById };
  const vehicleHoldings: T[] = [];
  const places = new Map<string, { spellings: string[]; holdings: T[] }>();

  for (const holding of holdings) {
    if (isItemCarried(holding)) continue;
    const trimmed = holding.itemLocation?.trim() ?? "";
    if (isVehicleItemLocation(trimmed)) {
      vehicleHoldings.push(holding);
      continue;
    }
    const storageKey = foldSharedName(trimmed);
    const bucket = places.get(storageKey);
    if (bucket) {
      bucket.holdings.push(holding);
      bucket.spellings.push(trimmed);
    } else {
      places.set(storageKey, { spellings: [trimmed], holdings: [holding] });
    }
  }

  const vehicleRows = sortInventoryEntriesAlphabetically(vehicleHoldings).map(
    (holding) => ({
      holding,
      locationLabel:
        formatItemLocationLabel(holding.itemLocation, labelOptions) ??
        trimmedLocation(holding),
    })
  );

  const drawers = [...places.entries()]
    .map(([storageKey, bucket]) => {
      const rows = sortInventoryEntriesAlphabetically(bucket.holdings);
      return {
        heading: spellingThatSortsFirst(bucket.spellings),
        storageKey,
        holdings: rows,
        holdingCount: rows.length,
        open: openByKey[storageKey] ?? true,
      };
    })
    .sort((left, right) =>
      left.heading.localeCompare(right.heading, undefined, {
        sensitivity: "base",
      })
    );

  return { vehicleRows, drawers };
}

function trimmedLocation(holding: StoredInventoryHolding): string {
  return holding.itemLocation?.trim() ?? "";
}

export function parseStoredDrawerOpen(raw: string): Record<string, boolean> {
  if (raw === "") return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return {};
    }
    const parsed: Record<string, boolean> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry === "boolean") parsed[key] = entry;
    }
    return parsed;
  } catch {
    return {};
  }
}

/** Open or closed places remembered for this character. Another character is empty. */
export function readStoredDrawerOpen(
  storage: StoredDrawerOpenStorage,
  characterId: string
): Record<string, boolean> {
  return parseStoredDrawerOpen(
    storage.getItem(storedDrawerSessionKey(characterId)) ?? ""
  );
}

export function readStoredDrawerOpenRaw(
  storage: StoredDrawerOpenStorage,
  characterId: string
): string {
  return storage.getItem(storedDrawerSessionKey(characterId)) ?? "";
}

/** Remember one place on this character. Other places already stored stay. */
export function writeStoredDrawerOpen(
  storage: StoredDrawerOpenStorage,
  characterId: string,
  placeKey: string,
  open: boolean
): void {
  const next = {
    ...readStoredDrawerOpen(storage, characterId),
    [placeKey]: open,
  };
  storage.setItem(storedDrawerSessionKey(characterId), JSON.stringify(next));
}
