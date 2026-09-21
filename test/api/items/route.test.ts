import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const createItemMock = vi.fn();
const getItemsMock = vi.fn();
const safeParseMock = vi.fn();
const userIsSuperAdminMock = vi.fn();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/staffCatalogueDrift", () => ({
  touchStaffCatalogueDrift: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/lib/prisma/item", () => ({
  createItem: createItemMock,
  getItems: getItemsMock,
}));

vi.mock("@/app/lib/types/item", () => ({
  itemSchema: { safeParse: safeParseMock },
}));

describe("/api/items route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
  });

  it("POST returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/items/route");

    const response = await invokeRoute(POST, makeUnauthedRequest({}));
    expect(response.status).toBe(401);
  });

  it("POST returns 403 when not super admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    const { POST } = await import("@/app/api/items/route");
    const response = await invokeRoute(POST, makeAuthedRequest({ name: "X" }));
    expect(response.status).toBe(403);
    expect(createItemMock).not.toHaveBeenCalled();
  });

  it("POST returns 400 on invalid request body", async () => {
    safeParseMock.mockReturnValue({
      error: { issues: [{ message: "invalid" }] },
      data: undefined,
    });
    const { POST } = await import("@/app/api/items/route");

    const response = await invokeRoute(POST, makeAuthedRequest({ bad: true }));
    expect(response.status).toBe(400);
  });

  it("POST returns 201 on success", async () => {
    getItemsMock.mockResolvedValue([]);
    safeParseMock.mockReturnValue({
      data: { name: "Sword" },
      error: undefined,
    });
    createItemMock.mockResolvedValue({ id: "item-1", name: "Sword" });
    const { POST } = await import("@/app/api/items/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ name: "Sword" })
    );
    expect(response.status).toBe(201);
    expect(createItemMock).toHaveBeenCalledWith(
      { name: "Sword" },
      { officialCatalogueWrite: true }
    );
  });

  it("POST returns 409 when the Official name collides after trim and case-fold", async () => {
    getItemsMock.mockResolvedValue([
      { id: "item-1", name: "Siike Gun", accessType: "PLAYER" },
    ]);
    safeParseMock.mockReturnValue({
      data: { name: "siike  gun", accessType: "GAME_MASTER" },
      error: undefined,
    });
    const { POST } = await import("@/app/api/items/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ name: "siike  gun", accessType: "GAME_MASTER" })
    );
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      message: "This Official name is already taken",
    });
    expect(createItemMock).not.toHaveBeenCalled();
  });

  it("POST returns 201 when SiikeGun is a different Official name from Siike Gun", async () => {
    getItemsMock.mockResolvedValue([{ id: "item-1", name: "Siike Gun" }]);
    safeParseMock.mockReturnValue({
      data: { name: "SiikeGun" },
      error: undefined,
    });
    createItemMock.mockResolvedValue({ id: "item-2", name: "SiikeGun" });
    const { POST } = await import("@/app/api/items/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ name: "SiikeGun" })
    );
    expect(response.status).toBe(201);
    expect(createItemMock).toHaveBeenCalled();
  });

  it("POST returns 409 when Prisma reports an exact Official name unique conflict", async () => {
    getItemsMock.mockResolvedValue([]);
    safeParseMock.mockReturnValue({
      data: { name: "Siike Gun" },
      error: undefined,
    });
    const { Prisma } = await import("@prisma/client");
    createItemMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "test",
      } as never)
    );
    const { POST } = await import("@/app/api/items/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ name: "Siike Gun" })
    );
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      message: "This Official name is already taken",
    });
  });

  it("GET returns 200 with items for authenticated users", async () => {
    getItemsMock.mockResolvedValue([{ id: "item-1" }]);
    const { GET } = await import("@/app/api/items/route");

    const response = await invokeRoute(GET, makeAuthedRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([{ id: "item-1" }]);
  });
});
