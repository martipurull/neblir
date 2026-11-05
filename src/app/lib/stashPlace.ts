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
