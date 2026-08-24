import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const deleteItemCharacterMock = vi.fn();
const getCharacterInventoryMock = vi.fn();
const updateItemCharacterMock = vi.fn();
const characterBelongsToUserMock = vi.fn();
const getCharacterMock = vi.fn();
const updateCharacterMock = vi.fn();
const vehicleMountedItemDeleteManyMock = vi.fn();
const itemCharacterUpdateMock = vi.fn();

vi.mock("@/app/lib/prisma/itemCharacter", () => ({
  deleteItemCharacter: deleteItemCharacterMock,
  getCharacterInventory: (...args: unknown[]) =>
    getCharacterInventoryMock(...args),
  updateItemCharacter: (...args: unknown[]) => updateItemCharacterMock(...args),
  getMaxUsesForItem: vi.fn(),
}));

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: characterBelongsToUserMock,
}));

vi.mock("@/app/lib/prisma/character", () => ({
  getCharacter: getCharacterMock,
  updateCharacter: updateCharacterMock,
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        vehicleMountedItem: {
          deleteMany: (...args: unknown[]) =>
            vehicleMountedItemDeleteManyMock(...args),
        },
        itemCharacter: {
          update: (...args: unknown[]) => itemCharacterUpdateMock(...args),
        },
      }),
  },
}));

vi.mock("@/app/lib/equipCombatUtils", () => ({
  computeCombatInfoUpdateForCharacter: () => ({}),
}));

describe("/api/characters/[id]/inventory/[itemCharacterId] DELETE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { DELETE } =
      await import("@/app/api/characters/[id]/inventory/[itemCharacterId]/route");
    const response = await invokeRoute(
      DELETE,
      makeUnauthedRequest(),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when character does not belong to user", async () => {
    characterBelongsToUserMock.mockResolvedValue(false);
    const { DELETE } =
      await import("@/app/api/characters/[id]/inventory/[itemCharacterId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 500 when deleteItemCharacter rejects", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    deleteItemCharacterMock.mockRejectedValue(new Error("db fail"));
    const { DELETE } =
      await import("@/app/api/characters/[id]/inventory/[itemCharacterId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(500);
  });

  it("returns 204 on successful deletion", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    deleteItemCharacterMock.mockResolvedValue(undefined);
    getCharacterMock.mockResolvedValue(null);
    const { DELETE } =
      await import("@/app/api/characters/[id]/inventory/[itemCharacterId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(204);
    expect(deleteItemCharacterMock).toHaveBeenCalledWith("ic-1");
  });
});

describe("/api/characters/[id]/inventory/[itemCharacterId] PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCharacterMock.mockResolvedValue(null);
    getCharacterInventoryMock
      .mockResolvedValueOnce([
        { id: "ic-1", equipSlots: [], itemLocation: "vehicle-mounted:vc-1" },
      ])
      .mockResolvedValueOnce([
        { id: "ic-1", equipSlots: [], itemLocation: "locker" },
      ]);
  });

  it("returns 401 when unauthenticated", async () => {
    const { PATCH } =
      await import("@/app/api/characters/[id]/inventory/[itemCharacterId]/route");
    const response = await invokeRoute(
      PATCH,
      makeUnauthedRequest({ action: "setLocation", itemLocation: "locker" }),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 on invalid body", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    const { PATCH } =
      await import("@/app/api/characters/[id]/inventory/[itemCharacterId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setLocation" }, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(400);
  });

  it("clears vehicle mounts when changing item location", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    vehicleMountedItemDeleteManyMock.mockResolvedValue({ count: 1 });
    itemCharacterUpdateMock.mockResolvedValue({});
    const { PATCH } =
      await import("@/app/api/characters/[id]/inventory/[itemCharacterId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { action: "setLocation", itemLocation: "locker" },
        "user-1"
      ),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(200);
    expect(vehicleMountedItemDeleteManyMock).toHaveBeenCalledWith({
      where: { itemCharacterId: "ic-1" },
    });
    expect(itemCharacterUpdateMock).toHaveBeenCalledWith({
      where: { id: "ic-1" },
      data: { itemLocation: "locker" },
    });
  });

  it("sets stack quantity on the holding", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getCharacterInventoryMock.mockReset();
    getCharacterInventoryMock
      .mockResolvedValueOnce([{ id: "ic-1", quantity: 3, equipSlots: [] }])
      .mockResolvedValueOnce([{ id: "ic-1", quantity: 7, equipSlots: [] }]);
    updateItemCharacterMock.mockResolvedValue({});
    const { PATCH } =
      await import("@/app/api/characters/[id]/inventory/[itemCharacterId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setQuantity", quantity: 7 }, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(200);
    expect(updateItemCharacterMock).toHaveBeenCalledWith("ic-1", {
      quantity: 7,
    });
  });

  it("deletes the holding when stack quantity is set to 0", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getCharacterInventoryMock.mockReset();
    getCharacterInventoryMock.mockResolvedValue([
      { id: "ic-1", quantity: 3, equipSlots: [] },
    ]);
    deleteItemCharacterMock.mockResolvedValue(undefined);
    const { PATCH } =
      await import("@/app/api/characters/[id]/inventory/[itemCharacterId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setQuantity", quantity: 0 }, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(204);
    expect(deleteItemCharacterMock).toHaveBeenCalledWith("ic-1");
  });

  it("rejects stack quantity above 999", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getCharacterInventoryMock.mockReset();
    getCharacterInventoryMock.mockResolvedValue([
      { id: "ic-1", quantity: 3, equipSlots: [] },
    ]);
    const { PATCH } =
      await import("@/app/api/characters/[id]/inventory/[itemCharacterId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setQuantity", quantity: 1000 }, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(400);
    expect(updateItemCharacterMock).not.toHaveBeenCalled();
  });

  it("sets and clears a nickname on the holding", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getCharacterInventoryMock.mockReset();
    getCharacterInventoryMock
      .mockResolvedValueOnce([{ id: "ic-1", quantity: 1, equipSlots: [] }])
      .mockResolvedValueOnce([
        { id: "ic-1", quantity: 1, equipSlots: [], customName: "Lucky blade" },
      ]);
    updateItemCharacterMock.mockResolvedValue({});
    const { PATCH } =
      await import("@/app/api/characters/[id]/inventory/[itemCharacterId]/route");
    const setResponse = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { action: "setCustomName", customName: "Lucky blade" },
        "user-1"
      ),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(setResponse.status).toBe(200);
    expect(updateItemCharacterMock).toHaveBeenCalledWith("ic-1", {
      customName: "Lucky blade",
    });

    getCharacterInventoryMock
      .mockResolvedValueOnce([{ id: "ic-1", quantity: 1, equipSlots: [] }])
      .mockResolvedValueOnce([{ id: "ic-1", quantity: 1, equipSlots: [] }]);
    const clearResponse = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { action: "setCustomName", customName: "  " },
        "user-1"
      ),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(clearResponse.status).toBe(200);
    expect(updateItemCharacterMock).toHaveBeenCalledWith("ic-1", {
      customName: null,
    });
  });
});
