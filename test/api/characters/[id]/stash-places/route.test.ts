import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequestWithUrl,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const userHasPlayControlMock = vi.fn();
const characterIsInGameMock = vi.fn();
const itemCharacterFindManyMock = vi.fn();

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  userHasPlayControl: (...args: unknown[]) => userHasPlayControlMock(...args),
  characterIsInGame: (...args: unknown[]) => characterIsInGameMock(...args),
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    itemCharacter: {
      findMany: (...args: unknown[]) => itemCharacterFindManyMock(...args),
    },
  },
}));

function placeListUrl(gameId?: string) {
  const base = "http://localhost/api/characters/char-1/stash-places";
  return gameId == null ? base : `${base}?gameId=${encodeURIComponent(gameId)}`;
}

describe("GET /api/characters/[id]/stash-places", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userHasPlayControlMock.mockResolvedValue(true);
    characterIsInGameMock.mockResolvedValue(true);
    itemCharacterFindManyMock.mockResolvedValue([]);
  });

  it("returns 401 when the caller is not signed in", async () => {
    const { GET } =
      await import("@/app/api/characters/[id]/stash-places/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(401);
    expect(itemCharacterFindManyMock).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller lacks play control", async () => {
    userHasPlayControlMock.mockResolvedValue(false);
    const { GET } =
      await import("@/app/api/characters/[id]/stash-places/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(placeListUrl("game-1"), "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(403);
    expect(itemCharacterFindManyMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the character id is missing", async () => {
    const { GET } =
      await import("@/app/api/characters/[id]/stash-places/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(placeListUrl("game-1"), "user-1"),
      makeParams({ id: "" })
    );
    expect(response.status).toBe(400);
    expect(itemCharacterFindManyMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the character is not linked to the game", async () => {
    characterIsInGameMock.mockResolvedValue(false);
    const { GET } =
      await import("@/app/api/characters/[id]/stash-places/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(placeListUrl("game-1"), "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe(
      "Character is not linked to the supplied game."
    );
    expect(itemCharacterFindManyMock).not.toHaveBeenCalled();
  });

  it("returns place names only for this game and this character's unshared places", async () => {
    itemCharacterFindManyMock.mockResolvedValue([
      {
        characterId: "other",
        itemLocation: "Indira's Flat",
        stashGameId: "game-1",
        customName: "Rifle",
      },
      {
        characterId: "char-1",
        itemLocation: "Locker",
        stashGameId: null,
        customName: "Coat",
      },
      {
        characterId: "other",
        itemLocation: "Secret cache",
        stashGameId: null,
        customName: "Map",
      },
      {
        characterId: "other",
        itemLocation: "Armoury",
        stashGameId: "game-2",
        customName: "Crate",
      },
      {
        characterId: "other",
        itemLocation: "vehicle:vc-1",
        stashGameId: "game-1",
        customName: "Spare",
      },
    ]);
    const { GET } =
      await import("@/app/api/characters/[id]/stash-places/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(placeListUrl("game-1"), "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(["Indira's Flat", "Locker"]);
  });

  it("returns this character's unshared places when no game is active", async () => {
    itemCharacterFindManyMock.mockResolvedValue([
      {
        characterId: "char-1",
        itemLocation: "Locker",
        stashGameId: null,
      },
      {
        characterId: "char-1",
        itemLocation: "Indira's Flat",
        stashGameId: "game-1",
      },
    ]);
    const { GET } =
      await import("@/app/api/characters/[id]/stash-places/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(placeListUrl(), "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(["Locker"]);
    expect(characterIsInGameMock).not.toHaveBeenCalled();
  });

  it("returns 500 when place names cannot be loaded", async () => {
    itemCharacterFindManyMock.mockRejectedValue(new Error("db down"));
    const { GET } =
      await import("@/app/api/characters/[id]/stash-places/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequestWithUrl(placeListUrl("game-1"), "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(500);
  });
});
