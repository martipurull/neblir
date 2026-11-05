import {
  formatItemLocationLabel,
  isItemCarried,
  isVehicleItemLocation,
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

type StoredVehicleRow<T> = {
  holding: T;
  locationLabel: string;
};

type StashDrawer<T> = {
  heading: string;
  /** Fold of this stash. This character's open or closed memory uses this key. */
  stashKey: string;
  holdings: T[];
  holdingCount: number;
  open: boolean;
};

export type StoredInventoryLayout<T> = {
  vehicleRows: StoredVehicleRow<T>[];
  stashDrawers: StashDrawer<T>[];
};

export type StashDrawerOpenState = Readonly<Record<string, boolean>>;

export type StashDrawerOpenStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

const SESSION_PREFIX = "neblir:stash-drawer-open:v1:";

function stashDrawerSessionKey(characterId: string): string {
  return `${SESSION_PREFIX}${characterId}`;
}

/**
 * Stored section for one character: vehicle cargo and mounted rows, then one
 * stash drawer per stash. Spellings that share a fold are one stash drawer.
 * The same spelling in two games is one stash drawer. A stash drawer with no
 * stored choice is open.
 */
export function projectStoredInventory<T extends StoredInventoryHolding>(
  holdings: readonly T[],
  options?: {
    vehicleNamesById?: FormatItemLocationLabelOptions["vehicleNamesById"];
    openByKey?: StashDrawerOpenState;
  }
): StoredInventoryLayout<T> {
  const openByKey = options?.openByKey ?? {};
  const labelOptions = { vehicleNamesById: options?.vehicleNamesById };
  const vehicleHoldings: T[] = [];
  const stashes = new Map<string, { spellings: string[]; holdings: T[] }>();

  for (const holding of holdings) {
    if (isItemCarried(holding)) continue;
    const trimmed = holding.itemLocation?.trim() ?? "";
    if (isVehicleItemLocation(trimmed)) {
      vehicleHoldings.push(holding);
      continue;
    }
    const stashKey = foldSharedName(trimmed);
    const bucket = stashes.get(stashKey);
    if (bucket) {
      bucket.holdings.push(holding);
      bucket.spellings.push(trimmed);
    } else {
      stashes.set(stashKey, { spellings: [trimmed], holdings: [holding] });
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

  const stashDrawers = [...stashes.entries()]
    .map(([stashKey, bucket]) => {
      const rows = sortInventoryEntriesAlphabetically(bucket.holdings);
      return {
        heading: spellingThatSortsFirst(bucket.spellings),
        stashKey,
        holdings: rows,
        holdingCount: rows.length,
        open: openByKey[stashKey] ?? true,
      };
    })
    .sort((left, right) =>
      left.heading.localeCompare(right.heading, undefined, {
        sensitivity: "base",
      })
    );

  return { vehicleRows, stashDrawers };
}

function trimmedLocation(holding: StoredInventoryHolding): string {
  return holding.itemLocation?.trim() ?? "";
}

export function parseStashDrawerOpen(raw: string): Record<string, boolean> {
  if (raw === "") return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return {};
    }
    const parsed: Record<string, boolean> = {};
    for (const [stashKey, open] of Object.entries(value)) {
      if (typeof open === "boolean") parsed[stashKey] = open;
    }
    return parsed;
  } catch {
    return {};
  }
}

/** Open or closed stash drawers remembered for this character. Another character is empty. */
export function readStashDrawerOpen(
  storage: StashDrawerOpenStorage,
  characterId: string
): Record<string, boolean> {
  return parseStashDrawerOpen(
    storage.getItem(stashDrawerSessionKey(characterId)) ?? ""
  );
}

export function readStashDrawerOpenRaw(
  storage: StashDrawerOpenStorage,
  characterId: string
): string {
  return storage.getItem(stashDrawerSessionKey(characterId)) ?? "";
}

/** Remember one stash on this character. Other stashes already stored stay. */
export function writeStashDrawerOpen(
  storage: StashDrawerOpenStorage,
  characterId: string,
  stashKey: string,
  open: boolean
): void {
  const next = {
    ...readStashDrawerOpen(storage, characterId),
    [stashKey]: open,
  };
  storage.setItem(stashDrawerSessionKey(characterId), JSON.stringify(next));
}
