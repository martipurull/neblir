import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getGameMock = vi.fn();
const characterIsInGameMock = vi.fn();
const addOrIncrementItemCharacterMock = vi.fn();
const customItemFindUniqueMock = vi.fn();
const uniqueItemFindUniqueMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
}));

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  characterIsInGame: characterIsInGameMock,
}));

vi.mock("@/app/lib/prisma/itemCharacter", () => ({
  addOrIncrementItemCharacter: addOrIncrementItemCharacterMock,
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    customItem: { findUnique: customItemFindUniqueMock },
    uniqueItem: { findUnique: uniqueItemFindUniqueMock },
  },
}));

describe("POST /api/games/[id]/give-item", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/games/[id]/give-item/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({
        characterId: "c-1",
        sourceType: "GLOBAL_ITEM",
        itemId: "i-1",
      }),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when game does not exist", async () => {
    getGameMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/games/[id]/give-item/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { characterId: "c-1", sourceType: "GLOBAL_ITEM", itemId: "i-1" },
        "user-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(404);
    expect(addOrIncrementItemCharacterMock).not.toHaveBeenCalled();
  });

  it("returns 403 when user is not game master", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "other-gm" });
    const { POST } = await import("@/app/api/games/[id]/give-item/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { characterId: "c-1", sourceType: "GLOBAL_ITEM", itemId: "i-1" },
        "user-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
    expect(addOrIncrementItemCharacterMock).not.toHaveBeenCalled();
  });

  it("returns 400 on invalid body", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "user-1" });
    const { POST } = await import("@/app/api/games/[id]/give-item/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { characterId: "", sourceType: "GLOBAL_ITEM", itemId: "i-1" },
        "user-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 403 when character is not in game", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "user-1" });
    characterIsInGameMock.mockResolvedValue(false);
    const { POST } = await import("@/app/api/games/[id]/give-item/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { characterId: "c-1", sourceType: "GLOBAL_ITEM", itemId: "i-1" },
        "user-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
    expect(addOrIncrementItemCharacterMock).not.toHaveBeenCalled();
  });

  it("returns 403 when custom item does not belong to game", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "user-1" });
    characterIsInGameMock.mockResolvedValue(true);
    customItemFindUniqueMock.mockResolvedValue({ gameId: "other-game" });
    const { POST } = await import("@/app/api/games/[id]/give-item/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { characterId: "c-1", sourceType: "CUSTOM_ITEM", itemId: "custom-1" },
        "user-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
    expect(addOrIncrementItemCharacterMock).not.toHaveBeenCalled();
  });

  it("returns 403 when unique item does not belong to game", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "user-1" });
    characterIsInGameMock.mockResolvedValue(true);
    uniqueItemFindUniqueMock.mockResolvedValue({ gameId: "other-game" });
    const { POST } = await import("@/app/api/games/[id]/give-item/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { characterId: "c-1", sourceType: "UNIQUE_ITEM", itemId: "unique-1" },
        "user-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
    expect(addOrIncrementItemCharacterMock).not.toHaveBeenCalled();
  });

  it("returns 201 and gives GLOBAL_ITEM on success", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "user-1" });
    characterIsInGameMock.mockResolvedValue(true);
    addOrIncrementItemCharacterMock.mockResolvedValue(undefined);
    const { POST } = await import("@/app/api/games/[id]/give-item/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { characterId: "c-1", sourceType: "GLOBAL_ITEM", itemId: "i-1" },
        "user-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(201);
    expect(addOrIncrementItemCharacterMock).toHaveBeenCalledWith(
      "c-1",
      "GLOBAL_ITEM",
      "i-1"
    );
  });

  it("returns 201 and gives CUSTOM_ITEM when item belongs to game", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "user-1" });
    characterIsInGameMock.mockResolvedValue(true);
    customItemFindUniqueMock.mockResolvedValue({ gameId: "g-1" });
    addOrIncrementItemCharacterMock.mockResolvedValue(undefined);
    const { POST } = await import("@/app/api/games/[id]/give-item/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { characterId: "c-1", sourceType: "CUSTOM_ITEM", itemId: "custom-1" },
        "user-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(201);
    expect(addOrIncrementItemCharacterMock).toHaveBeenCalledWith(
      "c-1",
      "CUSTOM_ITEM",
      "custom-1"
    );
  });

  it("returns 201 and gives UNIQUE_ITEM when item belongs to game", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "user-1" });
    characterIsInGameMock.mockResolvedValue(true);
    uniqueItemFindUniqueMock.mockResolvedValue({ gameId: "g-1" });
    addOrIncrementItemCharacterMock.mockResolvedValue(undefined);
    const { POST } = await import("@/app/api/games/[id]/give-item/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { characterId: "c-1", sourceType: "UNIQUE_ITEM", itemId: "unique-1" },
        "user-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(201);
    expect(addOrIncrementItemCharacterMock).toHaveBeenCalledWith(
      "c-1",
      "UNIQUE_ITEM",
      "unique-1"
    );
  });
});
