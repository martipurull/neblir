import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const characterBelongsToUserMock = vi.fn();
const getCharacterInventoryMock = vi.fn();
const createItemCharacterMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: characterBelongsToUserMock,
}));

vi.mock("@/app/lib/prisma/itemCharacter", () => ({
  getCharacterInventory: getCharacterInventoryMock,
  createItemCharacter: createItemCharacterMock,
}));

vi.mock("@/app/lib/types/item", () => ({
  addToInventorySchema: { safeParse: safeParseMock },
}));

describe("/api/characters/[id]/inventory handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/characters/[id]/inventory/route");
    const response = await invokeRoute(GET, makeUnauthedRequest(), makeParams({ id: "char-1" }));
    expect(response.status).toBe(401);
  });

  it("GET returns 403 when character is not owned", async () => {
    characterBelongsToUserMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/characters/[id]/inventory/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(403);
  });

  it("GET returns 200 with inventory on success", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getCharacterInventoryMock.mockResolvedValue([{ id: "ic-1" }]);
    const { GET } = await import("@/app/api/characters/[id]/inventory/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([{ id: "ic-1" }]);
  });

  it("POST returns 400 on invalid body", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: undefined,
      error: { issues: [{ message: "invalid item payload" }] },
    });
    const { POST } = await import("@/app/api/characters/[id]/inventory/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ bad: true }, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
  });

  it("POST returns 201 on success", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    safeParseMock.mockReturnValue({
      data: { sourceType: "GLOBAL_ITEM", itemId: "item-1" },
      error: undefined,
    });
    createItemCharacterMock.mockResolvedValue({ id: "ic-1" });
    const { POST } = await import("@/app/api/characters/[id]/inventory/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ sourceType: "GLOBAL_ITEM", itemId: "item-1" }, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(201);
    expect(createItemCharacterMock).toHaveBeenCalledWith({
      characterId: "char-1",
      sourceType: "GLOBAL_ITEM",
      itemId: "item-1",
    });
  });
});
