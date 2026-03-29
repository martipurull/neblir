import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const getGameMock = vi.fn();
const createUniqueItemMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
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

vi.mock("@/app/lib/types/item", () => ({
  uniqueItemCreateSchema: { safeParse: safeParseMock },
}));

describe("/api/unique-items POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/unique-items/route");
    const response = await invokeRoute(POST, makeUnauthedRequest());
    expect(response.status).toBe(401);
  });

  it("returns 400 on invalid payload", async () => {
    safeParseMock.mockReturnValue({
      error: { issues: [{ message: "invalid payload" }] },
      data: undefined,
    });
    const { POST } = await import("@/app/api/unique-items/route");

    const response = await invokeRoute(POST, makeAuthedRequest({ bad: true }));
    expect(response.status).toBe(400);
  });

  it("returns 404 when game does not exist", async () => {
    safeParseMock.mockReturnValue({
      data: { gameId: "g-1", sourceType: "GLOBAL_ITEM", itemId: "item-1" },
      error: undefined,
    });
    getGameMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/unique-items/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        gameId: "g-1",
        sourceType: "GLOBAL_ITEM",
        itemId: "item-1",
      })
    );
    expect(response.status).toBe(404);
    expect(createUniqueItemMock).not.toHaveBeenCalled();
  });

  it("returns 403 when user is not game master", async () => {
    safeParseMock.mockReturnValue({
      data: { gameId: "g-1", sourceType: "GLOBAL_ITEM", itemId: "item-1" },
      error: undefined,
    });
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "other-gm" });
    const { POST } = await import("@/app/api/unique-items/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        gameId: "g-1",
        sourceType: "GLOBAL_ITEM",
        itemId: "item-1",
      })
    );
    expect(response.status).toBe(403);
    expect(createUniqueItemMock).not.toHaveBeenCalled();
  });

  it("returns 201 and creates unique item on success", async () => {
    safeParseMock.mockReturnValue({
      data: {
        gameId: "g-1",
        sourceType: "GLOBAL_ITEM",
        itemId: "item-1",
      },
      error: undefined,
    });
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "user-1" });
    createUniqueItemMock.mockResolvedValue({ id: "u-1" });
    const { POST } = await import("@/app/api/unique-items/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        gameId: "g-1",
        sourceType: "GLOBAL_ITEM",
        itemId: "item-1",
      })
    );
    expect(response.status).toBe(201);
    expect(createUniqueItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: "g-1",
        sourceType: "GLOBAL_ITEM",
        itemId: "item-1",
      })
    );
  });

  it("returns 201 for STANDALONE without gameId (no getGame call)", async () => {
    safeParseMock.mockReturnValue({
      data: {
        sourceType: "STANDALONE",
        nameOverride: "Bracelet",
        weightOverride: 0.2,
      },
      error: undefined,
    });
    createUniqueItemMock.mockResolvedValue({ id: "u-standalone" });
    const { POST } = await import("@/app/api/unique-items/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        sourceType: "STANDALONE",
        nameOverride: "Bracelet",
        weightOverride: 0.2,
      })
    );
    expect(response.status).toBe(201);
    expect(getGameMock).not.toHaveBeenCalled();
    expect(createUniqueItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "STANDALONE",
        nameOverride: "Bracelet",
        weightOverride: 0.2,
      })
    );
  });

  it("returns 201 for STANDALONE with gameId when user is GM", async () => {
    safeParseMock.mockReturnValue({
      data: {
        sourceType: "STANDALONE",
        nameOverride: "Bracelet",
        weightOverride: 0.2,
        gameId: "g-1",
      },
      error: undefined,
    });
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "user-1" });
    createUniqueItemMock.mockResolvedValue({ id: "u-2" });
    const { POST } = await import("@/app/api/unique-items/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        sourceType: "STANDALONE",
        nameOverride: "Bracelet",
        weightOverride: 0.2,
        gameId: "g-1",
      })
    );
    expect(response.status).toBe(201);
    expect(getGameMock).toHaveBeenCalledWith("g-1");
    expect(createUniqueItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: "g-1",
        sourceType: "STANDALONE",
      })
    );
  });
});
