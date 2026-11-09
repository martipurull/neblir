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
const characterIsInGameMock = vi.fn();
const getCharacterMock = vi.fn();
const updateCharacterMock = vi.fn();
const vehicleMountedItemDeleteManyMock = vi.fn();
const botInstalledItemDeleteManyMock = vi.fn();
const itemCharacterUpdateMock = vi.fn();
const itemCharacterFindManyMock = vi.fn();

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

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  userHasPlayControl: characterBelongsToUserMock,
  characterIsInGame: (...args: unknown[]) => characterIsInGameMock(...args),
}));

vi.mock("@/app/lib/prisma/character", () => ({
  getCharacter: getCharacterMock,
  updateCharacter: updateCharacterMock,
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    itemCharacter: {
      findMany: (...args: unknown[]) => itemCharacterFindManyMock(...args),
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        vehicleMountedItem: {
          deleteMany: (...args: unknown[]) =>
            vehicleMountedItemDeleteManyMock(...args),
        },
        botInstalledItem: {
          deleteMany: (...args: unknown[]) =>
            botInstalledItemDeleteManyMock(...args),
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
    characterIsInGameMock.mockResolvedValue(true);
    itemCharacterFindManyMock.mockResolvedValue([]);
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
      makeUnauthedRequest({ action: "leave", placeName: "locker" }),
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
      makeAuthedRequest(
        { action: "setLocation", itemLocation: "locker" },
        "user-1"
      ),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(400);
  });

  it("clears vehicle mounts when an item is left", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getCharacterInventoryMock.mockResolvedValue([
      { id: "ic-1", quantity: 1, equipSlots: [], itemLocation: "carried" },
    ]);
    vehicleMountedItemDeleteManyMock.mockResolvedValue({ count: 1 });
    botInstalledItemDeleteManyMock.mockResolvedValue({ count: 0 });
    itemCharacterUpdateMock.mockResolvedValue({});
    const { PATCH } =
      await import("@/app/api/characters/[id]/inventory/[itemCharacterId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "leave", placeName: "locker" }, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(200);
    expect(vehicleMountedItemDeleteManyMock).toHaveBeenCalledWith({
      where: { itemCharacterId: "ic-1" },
    });
    expect(itemCharacterUpdateMock).toHaveBeenCalledWith({
      where: { id: "ic-1" },
      data: { itemLocation: "locker", stashGameId: null },
    });
    expect(botInstalledItemDeleteManyMock).toHaveBeenCalledWith({
      where: { itemCharacterId: "ic-1" },
    });
  });

  it("refuses a bot placement location from the inventory row", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getCharacterInventoryMock.mockResolvedValue([
      { id: "ic-1", quantity: 1, equipSlots: [], itemLocation: "carried" },
    ]);
    const { PATCH } =
      await import("@/app/api/characters/[id]/inventory/[itemCharacterId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { action: "leave", placeName: "bot-cargo:hold-1" },
        "user-1"
      ),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        message: "Place items on a bot from the bot holding.",
      })
    );
    expect(itemCharacterUpdateMock).not.toHaveBeenCalled();
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

  async function patchInventory(body: unknown, authed = true) {
    const { PATCH } =
      await import("@/app/api/characters/[id]/inventory/[itemCharacterId]/route");
    return invokeRoute(
      PATCH,
      authed ? makeAuthedRequest(body, "user-1") : makeUnauthedRequest(body),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
  }

  function mockHolding(entry: Record<string, unknown> = {}) {
    characterBelongsToUserMock.mockResolvedValue(true);
    vehicleMountedItemDeleteManyMock.mockResolvedValue({ count: 0 });
    itemCharacterUpdateMock.mockResolvedValue({});
    getCharacterInventoryMock.mockReset();
    const row = {
      id: "ic-1",
      equipSlots: [] as string[],
      itemLocation: "carried",
      ...entry,
    };
    getCharacterInventoryMock
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([row]);
  }

  function expectLocationUnchanged() {
    expect(itemCharacterUpdateMock).not.toHaveBeenCalled();
    expect(vehicleMountedItemDeleteManyMock).not.toHaveBeenCalled();
  }

  it("records the active game on the item being left and leaves other items at that spelling unshared", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    vehicleMountedItemDeleteManyMock.mockResolvedValue({ count: 0 });
    itemCharacterUpdateMock.mockResolvedValue({});
    getCharacterInventoryMock.mockReset();
    getCharacterInventoryMock.mockResolvedValue([
      { id: "ic-1", equipSlots: [], itemLocation: "carried" },
      {
        id: "ic-2",
        equipSlots: [],
        itemLocation: "Locker",
        stashGameId: null,
      },
    ]);
    itemCharacterFindManyMock.mockResolvedValue([]);
    const response = await patchInventory({
      action: "leave",
      placeName: "Locker",
      gameId: "game-1",
    });
    expect(response.status).toBe(200);
    expect(itemCharacterUpdateMock).toHaveBeenCalledTimes(1);
    expect(itemCharacterUpdateMock).toHaveBeenCalledWith({
      where: { id: "ic-1" },
      data: { itemLocation: "Locker", stashGameId: "game-1" },
    });
  });

  it("records the active game and keeps the spelling already stored", async () => {
    mockHolding();
    itemCharacterFindManyMock.mockResolvedValue([
      { itemLocation: "Indira's Flat" },
    ]);
    const response = await patchInventory({
      action: "leave",
      placeName: "indira flat",
      gameId: "game-1",
    });
    expect(response.status).toBe(200);
    expect(itemCharacterUpdateMock).toHaveBeenCalledWith({
      where: { id: "ic-1" },
      data: { itemLocation: "Indira's Flat", stashGameId: "game-1" },
    });
  });

  it("writes the spelling that sorts first when several matches are stored", async () => {
    mockHolding();
    itemCharacterFindManyMock.mockResolvedValue([
      { itemLocation: "Indira's Flat" },
      { itemLocation: "indira flat" },
      { itemLocation: "Indira's flat" },
    ]);
    const response = await patchInventory({
      action: "leave",
      placeName: "Indira's Flat",
      gameId: "game-1",
    });
    expect(response.status).toBe(200);
    expect(itemCharacterUpdateMock).toHaveBeenCalledWith({
      where: { id: "ic-1" },
      data: { itemLocation: "indira flat", stashGameId: "game-1" },
    });
  });

  it("keeps Guns and Gun as different places", async () => {
    mockHolding();
    itemCharacterFindManyMock.mockResolvedValue([{ itemLocation: "Guns" }]);
    const response = await patchInventory({
      action: "leave",
      placeName: "Gun",
      gameId: "game-1",
    });
    expect(response.status).toBe(200);
    expect(itemCharacterUpdateMock).toHaveBeenCalledWith({
      where: { id: "ic-1" },
      data: { itemLocation: "Gun", stashGameId: "game-1" },
    });
  });

  it("keeps this character's stored spelling when no game is active", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    vehicleMountedItemDeleteManyMock.mockResolvedValue({ count: 0 });
    itemCharacterUpdateMock.mockResolvedValue({});
    getCharacterInventoryMock.mockReset();
    getCharacterInventoryMock.mockResolvedValue([
      { id: "ic-1", equipSlots: [], itemLocation: "carried" },
      {
        id: "ic-2",
        equipSlots: [],
        itemLocation: "Indira's Flat",
        stashGameId: null,
      },
    ]);
    const response = await patchInventory({
      action: "leave",
      placeName: "indira flat",
    });
    expect(response.status).toBe(200);
    expect(itemCharacterUpdateMock).toHaveBeenCalledWith({
      where: { id: "ic-1" },
      data: { itemLocation: "Indira's Flat", stashGameId: null },
    });
    expect(itemCharacterFindManyMock).not.toHaveBeenCalled();
  });

  it("stores the place and leaves the game empty when no game is active", async () => {
    mockHolding();
    itemCharacterFindManyMock.mockResolvedValue([
      { itemLocation: "Indira's Flat" },
    ]);
    const response = await patchInventory({
      action: "leave",
      placeName: "  indira flat  ",
    });
    expect(response.status).toBe(200);
    expect(itemCharacterUpdateMock).toHaveBeenCalledWith({
      where: { id: "ic-1" },
      data: { itemLocation: "indira flat", stashGameId: null },
    });
    expect(characterIsInGameMock).not.toHaveBeenCalled();
  });

  it("sets the item carried and clears the recorded game on take with you", async () => {
    mockHolding({
      itemLocation: "Indira's Flat",
      stashGameId: "game-1",
    });
    const response = await patchInventory({ action: "take" });
    expect(response.status).toBe(200);
    expect(itemCharacterUpdateMock).toHaveBeenCalledWith({
      where: { id: "ic-1" },
      data: { itemLocation: "carried", stashGameId: null },
    });
  });

  it("unequips a worn item when it is left at a place", async () => {
    mockHolding({ equipSlots: ["HAND"], isEquipped: true });
    const response = await patchInventory({
      action: "leave",
      placeName: "Locker",
    });
    expect(response.status).toBe(200);
    expect(itemCharacterUpdateMock).toHaveBeenCalledWith({
      where: { id: "ic-1" },
      data: {
        itemLocation: "Locker",
        stashGameId: null,
        equipSlots: [],
        isEquipped: false,
      },
    });
  });

  it("rejects an empty place name and does not write", async () => {
    mockHolding();
    const response = await patchInventory({
      action: "leave",
      placeName: "   ",
    });
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe("Enter a place name.");
    expectLocationUnchanged();
  });

  it("rejects a punctuation-only place name and does not write", async () => {
    mockHolding();
    const response = await patchInventory({
      action: "leave",
      placeName: "!!!",
    });
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe("Enter a place name.");
    expectLocationUnchanged();
  });

  it("rejects a name that folds to carried and does not write", async () => {
    mockHolding();
    const response = await patchInventory({
      action: "leave",
      placeName: "carried",
    });
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe(
      "That word is reserved for items the character is carrying. Choose a place name."
    );
    expectLocationUnchanged();
  });

  it("rejects a vehicle cargo or mounted location and does not write", async () => {
    mockHolding();
    const cargo = await patchInventory({
      action: "leave",
      placeName: "vehicle:vc-1",
    });
    expect(cargo.status).toBe(400);
    expect((await cargo.json()).message).toBe(
      "That name is reserved for items in or on a vehicle. Use the vehicle's cargo or mount controls, or choose a place name."
    );
    expectLocationUnchanged();

    mockHolding();
    const mounted = await patchInventory({
      action: "leave",
      placeName: "  vehicle-mounted:vc-1  ",
    });
    expect(mounted.status).toBe(400);
    expect((await mounted.json()).message).toBe(
      "That name is reserved for items in or on a vehicle. Use the vehicle's cargo or mount controls, or choose a place name."
    );
    expectLocationUnchanged();
  });

  it("does not leave the item when the caller is not signed in", async () => {
    mockHolding();
    const response = await patchInventory(
      { action: "leave", placeName: "Locker", gameId: "game-1" },
      false
    );
    expect(response.status).toBe(401);
    expectLocationUnchanged();
  });

  it("does not leave the item when the caller lacks play control", async () => {
    mockHolding();
    characterBelongsToUserMock.mockResolvedValue(false);
    const response = await patchInventory({
      action: "leave",
      placeName: "Locker",
      gameId: "game-1",
    });
    expect(response.status).toBe(403);
    expectLocationUnchanged();
  });

  it("rejects a game the character is not linked to and does not write", async () => {
    mockHolding();
    characterIsInGameMock.mockResolvedValue(false);
    const response = await patchInventory({
      action: "leave",
      placeName: "Locker",
      gameId: "game-1",
    });
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe(
      "Character is not linked to the supplied game."
    );
    expectLocationUnchanged();
  });
});
