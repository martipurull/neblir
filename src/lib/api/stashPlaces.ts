import { stashPlaceNamesResponseSchema } from "@/app/lib/types/character";
import { readApiErrorBody, responseShapeError } from "@/lib/api/responseShape";
import { getUserSafeApiError } from "@/lib/userSafeError";

export async function getStashPlaceNames(
  characterId: string,
  gameId: string | null,
  signal?: AbortSignal
): Promise<string[]> {
  const search = new URLSearchParams();
  if (gameId) search.set("gameId", gameId);
  const query = search.toString();
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/stash-places${query ? `?${query}` : ""}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to load places"
      )
    );
  }

  const parsed = stashPlaceNamesResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Stash places", parsed.error);
  }
  return parsed.data;
}
