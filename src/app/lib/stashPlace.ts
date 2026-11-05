import {
  ITEM_LOCATION_CARRIED,
  isVehicleItemLocation,
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
const CARRIED_FOLD = foldSharedName(ITEM_LOCATION_CARRIED);

type PlaceName =
  | { ok: true; trimmed: string; key: string }
  | { ok: false; message: string };

/** A typed or stored whereabouts, or why it cannot be a place name. */
function readPlaceName(candidate: string): PlaceName {
  const trimmed = candidate.trim();
  if (isVehicleItemLocation(trimmed)) {
    return { ok: false, message: VEHICLE_RESERVED };
  }
  const key = foldSharedName(trimmed);
  if (key === "") return { ok: false, message: PLACE_NAME_REQUIRED };
  if (key === CARRIED_FOLD) return { ok: false, message: CARRIED_RESERVED };
  return { ok: true, trimmed, key };
}

type PlaceListClause = {
  characterId?: string;
  stashGameId: string | null;
};

/** Shared places for the active game, and this character's places with no game. */
function placeListClauses(
  characterId: string,
  gameId: string | null
): { shared: PlaceListClause | null; unshared: PlaceListClause } {
  return {
    shared: gameId == null ? null : { stashGameId: gameId },
    unshared: { characterId, stashGameId: null },
  };
}

function holdingMatchesClause(
  holding: StashPlaceHolding,
  clause: PlaceListClause
): boolean {
  if (clause.stashGameId != null) {
    return holding.stashGameId === clause.stashGameId;
  }
  return (
    holding.stashGameId == null && holding.characterId === clause.characterId
  );
}

function placeListRole(
  holding: StashPlaceHolding,
  characterId: string,
  gameId: string | null
): "shared" | "unshared" | null {
  const { shared, unshared } = placeListClauses(characterId, gameId);
  if (shared != null && holdingMatchesClause(holding, shared)) return "shared";
  if (holdingMatchesClause(holding, unshared)) return "unshared";
  return null;
}

/** Query for the holdings `stashPlaceNames` will consider. */
export function stashPlaceHoldingsWhere(
  characterId: string,
  gameId: string | null
): PlaceListClause | { OR: PlaceListClause[] } {
  const { shared, unshared } = placeListClauses(characterId, gameId);
  if (shared == null) return unshared;
  return { OR: [shared, unshared] };
}

export type ResolvedStashPlaceName =
  | { ok: true; placeName: string }
  | { ok: false; message: string };

/** One holding the picker can consider. Item identity is not part of the offer. */
export type StashPlaceHolding = {
  characterId: string;
  itemLocation: string;
  stashGameId: string | null;
};

/**
 * Place name to store. Spellings that share a fold keep the one already stored,
 * or the one that sorts first when several are stored. A new place keeps the
 * trimmed spelling the player typed.
 */
export function resolveStashPlaceName(
  candidate: string,
  existingSpellings: readonly string[]
): ResolvedStashPlaceName {
  const place = readPlaceName(candidate);
  if (!place.ok) return place;

  const matches = existingSpellings.flatMap((spelling) => {
    const stored = readPlaceName(spelling);
    if (!stored.ok || stored.key !== place.key) return [];
    return [stored.trimmed];
  });
  if (matches.length === 0) return { ok: true, placeName: place.trimmed };
  return { ok: true, placeName: spellingThatSortsFirst(matches) };
}

function comparePlaceNames(left: string, right: string): number {
  if (left === right) return 0;
  return spellingThatSortsFirst([left, right]) === left ? -1 : 1;
}

function spellingsByRole(
  holdings: readonly StashPlaceHolding[],
  characterId: string,
  gameId: string | null,
  role: "shared" | "unshared"
): Map<string, string[]> {
  const byFold = new Map<string, string[]>();
  for (const holding of holdings) {
    const place = readPlaceName(holding.itemLocation);
    if (!place.ok || placeListRole(holding, characterId, gameId) !== role) {
      continue;
    }
    const spellings = byFold.get(place.key) ?? [];
    spellings.push(place.trimmed);
    byFold.set(place.key, spellings);
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
  const shared = spellingsByRole(holdings, characterId, gameId, "shared");
  const unshared = spellingsByRole(holdings, characterId, gameId, "unshared");

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

/** The spelling already shown, and the spelling to store. */
export type StashRename = {
  from: string;
  placeName: string;
};

export type StashRenameHolding = {
  id: string;
  itemLocation: string;
  stashGameId: string | null;
};

type ResolvedStashRename =
  | { ok: true; placeName: string; holdingIds: string[] }
  | { ok: false; reason: "missing" }
  | { ok: false; reason: "invalid"; message: string };

function acceptedPlace(
  candidate: string
): { ok: true; trimmed: string; key: string } | { ok: false; message: string } {
  const resolved = resolveStashPlaceName(candidate, []);
  if (!resolved.ok) return resolved;
  return {
    ok: true,
    trimmed: resolved.placeName,
    key: foldSharedName(resolved.placeName),
  };
}

/**
 * Holdings recorded for this game whose place matches `from`, and the spelling to store.
 * A new spelling of this stash is kept as typed. Joining another stash in this game
 * keeps the spelling already saved there. Other games and places with no game are left out.
 */
export function resolveStashRename(
  holdings: readonly StashRenameHolding[],
  gameId: string,
  rename: StashRename
): ResolvedStashRename {
  const destination = acceptedPlace(rename.placeName);
  if (!destination.ok) {
    return { ok: false, reason: "invalid", message: destination.message };
  }

  const source = acceptedPlace(rename.from);
  if (!source.ok) return { ok: false, reason: "missing" };

  const matching: StashRenameHolding[] = [];
  const otherSpellings: string[] = [];
  for (const holding of holdings) {
    if (holding.stashGameId !== gameId) continue;
    const place = acceptedPlace(holding.itemLocation);
    if (!place.ok) continue;
    if (place.key === source.key) {
      matching.push(holding);
    } else {
      otherSpellings.push(place.trimmed);
    }
  }
  if (matching.length === 0) return { ok: false, reason: "missing" };

  const resolved = resolveStashPlaceName(destination.trimmed, otherSpellings);
  if (!resolved.ok) {
    return { ok: false, reason: "invalid", message: resolved.message };
  }
  return {
    ok: true,
    placeName: resolved.placeName,
    holdingIds: matching.map((holding) => holding.id),
  };
}
