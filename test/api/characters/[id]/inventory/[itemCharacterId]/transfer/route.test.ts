import { InventoryTransferConflictError } from "@/app/lib/prisma/inventoryTransfer";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../../helpers";

const validateMock = vi.fn();
const performMock = vi.fn();
const findFirstMock = vi.fn();
const belongsMock = vi.fn();

vi.mock("@/app/lib/prisma/inventoryTransfer", async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>;
  return {
    ...mod,
    validateInventoryTransferParties: (...args: unknown[]) =>
      validateMock(...args),
    performInventoryItemTransfer: (...args: unknown[]) => performMock(...args),
  };
});

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: (...args: unknown[]) => belongsMock(...args),
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    itemCharacter: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
    },
  },
}));

vi.mock("@/app/lib/prisma/character", () => ({
  getCharacter: vi.fn().mockResolvedValue(null),
  updateCharacter: vi.fn(),
}));

describe("POST /api/characters/[id]/inventory/[itemCharacterId]/transfer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateMock.mockResolvedValue(null);
    performMock.mockResolvedValue(undefined);
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import(
      "@/app/api/characters/[id]/inventory/[itemCharacterId]/transfer/route"
    );
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest(),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when character does not belong to user", async () => {
    belongsMock.mockResolvedValue(false);
    const { POST } = await import(
      "@/app/api/characters/[id]/inventory/[itemCharacterId]/transfer/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ toCharacterId: "char-2", quantity: 1 }, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 400 when quantity exceeds stack", async () => {
    belongsMock.mockResolvedValue(true);
    findFirstMock.mockResolvedValue({
      id: "ic-1",
      characterId: "char-1",
      quantity: 2,
      sourceType: "GLOBAL_ITEM",
      itemId: "item-1",
    });
    const { POST } = await import(
      "@/app/api/characters/[id]/inventory/[itemCharacterId]/transfer/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ toCharacterId: "char-2", quantity: 5 }, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(400);
    expect(performMock).not.toHaveBeenCalled();
  });

  it("returns 404 when inventory row missing", async () => {
    belongsMock.mockResolvedValue(true);
    findFirstMock.mockResolvedValue(null);
    const { POST } = await import(
      "@/app/api/characters/[id]/inventory/[itemCharacterId]/transfer/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ toCharacterId: "char-2", quantity: 1 }, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(404);
  });

  it("returns 403 when validateInventoryTransferParties fails", async () => {
    belongsMock.mockResolvedValue(true);
    findFirstMock.mockResolvedValue({
      id: "ic-1",
      characterId: "char-1",
      quantity: 3,
      sourceType: "GLOBAL_ITEM",
      itemId: "item-1",
    });
    validateMock.mockResolvedValue({ message: "nope", status: 403 });
    const { POST } = await import(
      "@/app/api/characters/[id]/inventory/[itemCharacterId]/transfer/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ toCharacterId: "char-2", quantity: 2 }, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(403);
    expect(performMock).not.toHaveBeenCalled();
  });

  it("returns 409 on InventoryTransferConflictError", async () => {
    belongsMock.mockResolvedValue(true);
    findFirstMock.mockResolvedValue({
      id: "ic-1",
      characterId: "char-1",
      quantity: 3,
      sourceType: "GLOBAL_ITEM",
      itemId: "item-1",
    });
    performMock.mockRejectedValue(
      new InventoryTransferConflictError("Stack changed")
    );
    const { POST } = await import(
      "@/app/api/characters/[id]/inventory/[itemCharacterId]/transfer/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ toCharacterId: "char-2", quantity: 1 }, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(409);
  });

  it("returns 200 and calls performInventoryItemTransfer", async () => {
    belongsMock.mockResolvedValue(true);
    findFirstMock.mockResolvedValue({
      id: "ic-1",
      characterId: "char-1",
      quantity: 3,
      sourceType: "GLOBAL_ITEM",
      itemId: "item-1",
    });
    const { POST } = await import(
      "@/app/api/characters/[id]/inventory/[itemCharacterId]/transfer/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ toCharacterId: "char-2", quantity: 2 }, "user-1"),
      makeParams({ id: "char-1", itemCharacterId: "ic-1" })
    );
    expect(response.status).toBe(200);
    expect(performMock).toHaveBeenCalledWith({
      fromCharacterId: "char-1",
      toCharacterId: "char-2",
      itemCharacterId: "ic-1",
      quantity: 2,
    });
  });
});
