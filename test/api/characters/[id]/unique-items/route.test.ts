import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const characterBelongsToUserMock = vi.fn();
const getCharacterMock = vi.fn();
const getCustomItemMock = vi.fn();
const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const getItemMock = vi.fn();
const createUniqueItemMock = vi.fn();
const addOrIncrementItemCharacterMock = vi.fn();
const getEffectiveMaxUsesForUniqueCreateMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: characterBelongsToUserMock,
}));

vi.mock("@/app/lib/prisma/character", () => ({
  getCharacter: getCharacterMock,
}));

vi.mock("@/app/lib/prisma/customItem", () => ({
  getCustomItem: getCustomItemMock,
}));

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/item", () => ({
  getItem: getItemMock,
}));

vi.mock("@/app/lib/prisma/uniqueItem", () => ({
  createUniqueItem: createUniqueItemMock,
  prismaDataFromUniqueItemCreate: (
    ownerUserId: string,
    gameId: string | undefined,
    parsed: Record<string, unknown>
  ) => ({
    ownerUserId,
    gameId,
    ...parsed,
  }),
}));

vi.mock("@/app/lib/prisma/itemCharacter", () => ({
  addOrIncrementItemCharacter: addOrIncrementItemCharacterMock,
  getEffectiveMaxUsesForUniqueCreate: getEffectiveMaxUsesForUniqueCreateMock,
}));

describe("POST /api/characters/[id]/unique-items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCharacterMock.mockResolvedValue({ id: "char-1" });
    createUniqueItemMock.mockResolvedValue({ id: "unique-1" });
    addOrIncrementItemCharacterMock.mockResolvedValue({ id: "ic-1" });
    getEffectiveMaxUsesForUniqueCreateMock.mockResolvedValue(null);
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import(
      "@/app/api/characters/[id]/unique-items/route"
    );
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when character is not owned", async () => {
    characterBelongsToUserMock.mockResolvedValue(false);
    const { POST } = await import(
      "@/app/api/characters/[id]/unique-items/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          sourceType: "STANDALONE",
          nameOverride: "Bracelet",
          weightOverride: 0.1,
        },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(403);
    expect(createUniqueItemMock).not.toHaveBeenCalled();
  });

  it("returns 404 when character does not exist", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getCharacterMock.mockResolvedValue(null);
    const { POST } = await import(
      "@/app/api/characters/[id]/unique-items/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          sourceType: "STANDALONE",
          nameOverride: "Bracelet",
          weightOverride: 0.1,
        },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(404);
    expect(createUniqueItemMock).not.toHaveBeenCalled();
  });

  it("returns 400 when STANDALONE payload is invalid (missing name)", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    const { POST } = await import(
      "@/app/api/characters/[id]/unique-items/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceType: "STANDALONE", nameOverride: "   ", weightOverride: 1 },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    expect(createUniqueItemMock).not.toHaveBeenCalled();
  });

  it("returns 400 when STANDALONE weight is negative", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    const { POST } = await import(
      "@/app/api/characters/[id]/unique-items/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          sourceType: "STANDALONE",
          nameOverride: "Thing",
          weightOverride: -0.5,
        },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    expect(createUniqueItemMock).not.toHaveBeenCalled();
  });

  it("returns 201 for STANDALONE with name and weight and adds to inventory", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    const { POST } = await import(
      "@/app/api/characters/[id]/unique-items/route"
    );
    const body = {
      sourceType: "STANDALONE" as const,
      nameOverride: "Mysterious bracelet",
      weightOverride: 0.05,
    };
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(body, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: "unique-1" });
    expect(createUniqueItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserId: "user-1",
        sourceType: "STANDALONE",
        nameOverride: "Mysterious bracelet",
        weightOverride: 0.05,
      })
    );
    expect(getEffectiveMaxUsesForUniqueCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "STANDALONE",
        nameOverride: "Mysterious bracelet",
      })
    );
    expect(addOrIncrementItemCharacterMock).toHaveBeenCalledWith(
      "char-1",
      "UNIQUE_ITEM",
      "unique-1",
      { initialCurrentUsesMax: null }
    );
    expect(userIsInGameMock).not.toHaveBeenCalled();
  });

  it("returns 403 when STANDALONE includes gameId but user is not in that game", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    userIsInGameMock.mockResolvedValue(false);
    const { POST } = await import(
      "@/app/api/characters/[id]/unique-items/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          sourceType: "STANDALONE",
          nameOverride: "Bracelet",
          weightOverride: 0.1,
          gameId: "g-1",
        },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(403);
    expect(userIsInGameMock).toHaveBeenCalledWith("g-1", "user-1");
    expect(createUniqueItemMock).not.toHaveBeenCalled();
  });

  it("returns 201 when STANDALONE includes gameId and user is in game", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    userIsInGameMock.mockResolvedValue(true);
    const { POST } = await import(
      "@/app/api/characters/[id]/unique-items/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          sourceType: "STANDALONE",
          nameOverride: "Bracelet",
          weightOverride: 0.1,
          gameId: "g-1",
        },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(201);
    expect(createUniqueItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: "g-1",
        sourceType: "STANDALONE",
      })
    );
  });

  it("returns 404 when GLOBAL_ITEM template is missing", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getItemMock.mockResolvedValue(null);
    const { POST } = await import(
      "@/app/api/characters/[id]/unique-items/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceType: "GLOBAL_ITEM", itemId: "missing-item" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(404);
    expect(createUniqueItemMock).not.toHaveBeenCalled();
  });

  it("returns 201 for GLOBAL_ITEM when template exists", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getItemMock.mockResolvedValue({ id: "item-1", name: "Knife" });
    const { POST } = await import(
      "@/app/api/characters/[id]/unique-items/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceType: "GLOBAL_ITEM", itemId: "item-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(201);
    expect(createUniqueItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "GLOBAL_ITEM",
        itemId: "item-1",
      })
    );
    expect(addOrIncrementItemCharacterMock).toHaveBeenCalledWith(
      "char-1",
      "UNIQUE_ITEM",
      "unique-1",
      { initialCurrentUsesMax: null }
    );
  });

  it("passes effective max uses into inventory when maxUsesOverride is set", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getItemMock.mockResolvedValue({ id: "item-1", name: "Knife" });
    getEffectiveMaxUsesForUniqueCreateMock.mockResolvedValue(7);
    const { POST } = await import(
      "@/app/api/characters/[id]/unique-items/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          sourceType: "GLOBAL_ITEM",
          itemId: "item-1",
          maxUsesOverride: 7,
        },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(201);
    expect(getEffectiveMaxUsesForUniqueCreateMock).toHaveBeenCalled();
    expect(addOrIncrementItemCharacterMock).toHaveBeenCalledWith(
      "char-1",
      "UNIQUE_ITEM",
      "unique-1",
      { initialCurrentUsesMax: 7 }
    );
  });

  it("returns 403 for CUSTOM_ITEM when user is not in template game", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getCustomItemMock.mockResolvedValue({ id: "c-1", gameId: "g-1" });
    getGameMock.mockResolvedValue({ id: "g-1" });
    userIsInGameMock.mockResolvedValue(false);
    const { POST } = await import(
      "@/app/api/characters/[id]/unique-items/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ sourceType: "CUSTOM_ITEM", itemId: "c-1" }, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(403);
    expect(createUniqueItemMock).not.toHaveBeenCalled();
  });

  it("returns 201 for CUSTOM_ITEM when user is in template game", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getCustomItemMock.mockResolvedValue({ id: "c-1", gameId: "g-1" });
    getGameMock.mockResolvedValue({ id: "g-1" });
    userIsInGameMock.mockResolvedValue(true);
    const { POST } = await import(
      "@/app/api/characters/[id]/unique-items/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ sourceType: "CUSTOM_ITEM", itemId: "c-1" }, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(201);
    expect(createUniqueItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "CUSTOM_ITEM",
        itemId: "c-1",
      })
    );
  });
});
