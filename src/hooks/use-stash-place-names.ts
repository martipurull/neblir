import { getStashPlaceNames } from "@/lib/api/stashPlaces";
import useSWR from "swr";

type HoldingPlace = {
  id: string;
  itemLocation?: string | null;
  stashGameId?: string | null;
};

/**
 * How often to reload shared place names while a game is active.
 * Matches the live game master page, so a place another character empties
 * drops off this list without opening an item.
 */
const SHARED_PLACE_REFRESH_MS = 3000;

/** Identity of where each holding sits. Changes when one is added, removed, or moved. */
function heldPlaceRecord(holdings: readonly HoldingPlace[]): string {
  return holdings
    .map(
      (holding) =>
        `${holding.id}\0${holding.itemLocation ?? ""}\0${holding.stashGameId ?? ""}`
    )
    .join("\n");
}

/**
 * Place names for leaving an item. Loaded for this character and active game,
 * again when those holdings move, and on a short interval while a game is
 * active. Opening an item does not load them.
 */
export function useStashPlaceNames(
  characterId: string,
  gameId: string | null,
  holdings: readonly HoldingPlace[],
  enabled: boolean
): readonly string[] {
  const heldPlaces = heldPlaceRecord(holdings);
  const { data } = useSWR(
    enabled
      ? (["stash-place-names", characterId, gameId ?? "", heldPlaces] as const)
      : null,
    () => getStashPlaceNames(characterId, gameId),
    { refreshInterval: gameId == null ? 0 : SHARED_PLACE_REFRESH_MS }
  );
  return data ?? [];
}
