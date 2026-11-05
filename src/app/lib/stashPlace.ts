import {
  ITEM_LOCATION_CARRIED,
  parseVehicleCargoItemLocation,
  parseVehicleMountedItemLocation,
} from "@/app/lib/constants/inventory";
import {
  foldSharedName,
  spellingThatSortsFirst,
} from "@/app/lib/sharedNameFold";

const PLACE_NAME_REQUIRED = "Enter a place name.";
const CARRIED_RESERVED =
  "That word is reserved for items the character is carrying. Choose a place name.";
const VEHICLE_RESERVED =
  "That name is reserved for items in or on a vehicle. Use the vehicle's cargo or mount controls, or choose a place name.";

export type ResolvedStashPlaceName =
  | { ok: true; placeName: string }
  | { ok: false; message: string };

/** One holding the picker can consider. Item identity is not part of the offer. */
export type StashPlaceHolding = {
  characterId: string;
  itemLocation: string;
  stashGameId: string | null;
};

function isVehicleItemLocation(value: string): boolean {
  return (
    parseVehicleCargoItemLocation(value) != null ||
    parseVehicleMountedItemLocation(value) != null
  );
}

/**
 * Place name to store. Spellings that share a fold keep the one already stored,
 * or the one that sorts first when several are stored. A new place keeps the
 * trimmed spelling the player typed.
 */
export function resolveStashPlaceName(
  candidate: string,
  existingSpellings: readonly string[]
): ResolvedStashPlaceName {
  const trimmed = candidate.trim();
  if (isVehicleItemLocation(trimmed)) {
    return { ok: false, message: VEHICLE_RESERVED };
  }
  const key = foldSharedName(trimmed);
  if (key === "") {
    return { ok: false, message: PLACE_NAME_REQUIRED };
  }
  if (key === foldSharedName(ITEM_LOCATION_CARRIED)) {
    return { ok: false, message: CARRIED_RESERVED };
  }

  const matches = existingSpellings.flatMap((spelling) => {
    const stored = spelling.trim();
    if (stored === "" || isVehicleItemLocation(stored)) return [];
    return foldSharedName(stored) === key ? [stored] : [];
  });
  if (matches.length === 0) return { ok: true, placeName: trimmed };
  return { ok: true, placeName: spellingThatSortsFirst(matches) };
}

function isOfferedPlace(itemLocation: string): boolean {
  const trimmed = itemLocation.trim();
  if (trimmed === "" || isVehicleItemLocation(trimmed)) return false;
  const key = foldSharedName(trimmed);
  return key !== "" && key !== foldSharedName(ITEM_LOCATION_CARRIED);
}

function comparePlaceNames(left: string, right: string): number {
  if (left === right) return 0;
  return spellingThatSortsFirst([left, right]) === left ? -1 : 1;
}

function spellingsByFold(
  holdings: readonly StashPlaceHolding[],
  include: (holding: StashPlaceHolding) => boolean
): Map<string, string[]> {
  const byFold = new Map<string, string[]>();
  for (const holding of holdings) {
    const location = holding.itemLocation.trim();
    if (!isOfferedPlace(location)) continue;
    const key = foldSharedName(location);
    if (!include(holding)) continue;
    const spellings = byFold.get(key) ?? [];
    spellings.push(location);
    byFold.set(key, spellings);
  }
  return byFold;
}

/**
 * Place names a character can pick while leaving an item.
 * Shared names are holdings recorded for the active game. Unshared names are
 * this character's places with no game. A fold that exists on the game is
 * shown under that game's spelling, once.
 */
export function stashPlaceNames(
  holdings: readonly StashPlaceHolding[],
  characterId: string,
  gameId: string | null
): string[] {
  const shared =
    gameId == null
      ? new Map<string, string[]>()
      : spellingsByFold(holdings, (holding) => holding.stashGameId === gameId);
  const unshared = spellingsByFold(
    holdings,
    (holding) =>
      holding.stashGameId == null && holding.characterId === characterId
  );

  const names: string[] = [];
  const folds = new Set([...shared.keys(), ...unshared.keys()]);
  for (const key of folds) {
    const sharedSpellings = shared.get(key);
    if (sharedSpellings != null && sharedSpellings.length > 0) {
      names.push(spellingThatSortsFirst(sharedSpellings));
      continue;
    }
    const ownSpellings = unshared.get(key);
    if (ownSpellings != null && ownSpellings.length > 0) {
      names.push(spellingThatSortsFirst(ownSpellings));
    }
  }
  return names.sort(comparePlaceNames);
}
