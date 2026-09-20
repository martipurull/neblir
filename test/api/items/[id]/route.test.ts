import { beforeEach, describe, expect, it, vi } from "vitest";
import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import {
  clearCatalogueR2,
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
  setCatalogueR2,
} from "../../helpers";

const getItemMock = vi.fn();
const getItemsMock = vi.fn();
const updateItemMock = vi.fn();
const deleteItemMock = vi.fn();
const safeParseMock = vi.fn();
const userIsSuperAdminMock = vi.fn();
const clearFavouriteWeaponPointersToItemMock = vi.fn();
const countOfficialRowsWithCatalogueImageKeyMock = vi.fn();
const s3SendMock = vi.fn();
const deleteObjectCommandCtorMock = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(function () {
    return {
      send: s3SendMock,
    };
  }),
  DeleteObjectCommand: vi.fn().mockImplementation(function (args: unknown) {
    deleteObjectCommandCtorMock(args);
    return args;
  }),
}));

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/staffCatalogueDrift", () => ({
  touchStaffCatalogueDrift: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/lib/prisma/item", () => ({
  getItem: getItemMock,
  getItems: getItemsMock,
  updateItem: updateItemMock,
  deleteItem: deleteItemMock,
}));

vi.mock("@/app/lib/prisma/pathCharacter", () => ({
  clearFavouriteWeaponPointersToItem: clearFavouriteWeaponPointersToItemMock,
}));

vi.mock("@/app/lib/prisma/officialCatalogueImage", () => ({
  countOfficialRowsWithCatalogueImageKey:
    countOfficialRowsWithCatalogueImageKeyMock,
}));

vi.mock("@/app/lib/types/item", () => ({
  itemUpdateSchema: { safeParse: safeParseMock },
}));

describe("/api/items/[id] route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
    clearFavouriteWeaponPointersToItemMock.mockResolvedValue(undefined);
    countOfficialRowsWithCatalogueImageKeyMock.mockResolvedValue(0);
    s3SendMock.mockResolvedValue({});
    getItemMock.mockResolvedValue({ id: "item-1", imageKey: null });
    deleteItemMock.mockResolvedValue(undefined);
    clearCatalogueR2();
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/items/[id]/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "item-1" })
    );
    expect(response.status).toBe(401);
  });

  it("GET returns 400 on missing id", async () => {
    const { GET } = await import("@/app/api/items/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "" })
    );
    expect(response.status).toBe(400);
  });

  it("PATCH returns 400 on invalid body", async () => {
    safeParseMock.mockReturnValue({
      error: { issues: [{ message: "bad patch body" }] },
      data: undefined,
    });
    const { PATCH } = await import("@/app/api/items/[id]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ bad: true }),
      makeParams({ id: "item-1" })
    );
    expect(response.status).toBe(400);
  });

  it("PATCH returns 200 on success", async () => {
    getItemsMock.mockResolvedValue([]);
    safeParseMock.mockReturnValue({
      data: { name: "Updated" },
      error: undefined,
    });
    updateItemMock.mockResolvedValue({ id: "item-1", name: "Updated" });
    const { PATCH } = await import("@/app/api/items/[id]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ name: "Updated" }),
      makeParams({ id: "item-1" })
    );
    expect(response.status).toBe(200);
    expect(updateItemMock).toHaveBeenCalledWith(
      "item-1",
      { name: "Updated" },
      {
        officialCatalogueWrite: true,
      }
    );
  });

  it("PATCH returns 409 when the Official name collides with another row", async () => {
    getItemsMock.mockResolvedValue([
      { id: "item-1", name: "Old Name" },
      { id: "item-2", name: "Siike Gun" },
    ]);
    safeParseMock.mockReturnValue({
      data: { name: "siike gun" },
      error: undefined,
    });
    const { PATCH } = await import("@/app/api/items/[id]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ name: "siike gun" }),
      makeParams({ id: "item-1" })
    );
    expect(response.status).toBe(409);
    expect(updateItemMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 200 when renaming a row to its own Official name", async () => {
    getItemsMock.mockResolvedValue([{ id: "item-1", name: "Siike Gun" }]);
    safeParseMock.mockReturnValue({
      data: { name: "siike gun" },
      error: undefined,
    });
    updateItemMock.mockResolvedValue({ id: "item-1", name: "siike gun" });
    const { PATCH } = await import("@/app/api/items/[id]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ name: "siike gun" }),
      makeParams({ id: "item-1" })
    );
    expect(response.status).toBe(200);
    expect(updateItemMock).toHaveBeenCalled();
  });

  it("DELETE returns 401 when unauthenticated", async () => {
    const { DELETE } = await import("@/app/api/items/[id]/route");
    const response = await invokeRoute(
      DELETE,
      makeUnauthedRequest(),
      makeParams({ id: "item-1" })
    );
    expect(response.status).toBe(401);
    expect(deleteItemMock).not.toHaveBeenCalled();
  });

  it("DELETE returns 403 when requester is not a super admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    const { DELETE } = await import("@/app/api/items/[id]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "item-1" })
    );
    expect(response.status).toBe(403);
    expect(deleteItemMock).not.toHaveBeenCalled();
  });

  it("DELETE returns 404 when the Official item is missing", async () => {
    getItemMock.mockResolvedValue(null);
    const { DELETE } = await import("@/app/api/items/[id]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "item-1" })
    );
    expect(response.status).toBe(404);
    expect(deleteItemMock).not.toHaveBeenCalled();
  });

  it("DELETE returns 204, clears favourite-weapon pointers, and does not rewire holdings", async () => {
    const { DELETE } = await import("@/app/api/items/[id]/route");

    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "item-1" })
    );
    expect(response.status).toBe(204);
    expect(clearFavouriteWeaponPointersToItemMock).toHaveBeenCalledWith(
      "item-1"
    );
    expect(deleteItemMock).toHaveBeenCalledWith("item-1");
    expect(touchStaffCatalogueDrift).toHaveBeenCalledWith(["items"]);
  });

  it("DELETE removes an unreferenced catalogue imageKey", async () => {
    setCatalogueR2();
    getItemMock.mockResolvedValue({
      id: "item-1",
      imageKey: "items-siike.png",
    });
    countOfficialRowsWithCatalogueImageKeyMock.mockResolvedValue(0);
    const { DELETE } = await import("@/app/api/items/[id]/route");

    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "item-1" })
    );
    expect(response.status).toBe(204);
    expect(deleteObjectCommandCtorMock).toHaveBeenCalledWith({
      Bucket: "neblir-catalogue",
      Key: "items-siike.png",
    });
    expect(s3SendMock).toHaveBeenCalled();
  });

  it("DELETE keeps a catalogue imageKey still used by another Official row", async () => {
    setCatalogueR2();
    getItemMock.mockResolvedValue({
      id: "item-1",
      imageKey: "items-siike.png",
    });
    countOfficialRowsWithCatalogueImageKeyMock.mockResolvedValue(1);
    const { DELETE } = await import("@/app/api/items/[id]/route");

    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "item-1" })
    );
    expect(response.status).toBe(204);
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("DELETE skips currencies- catalogue keys", async () => {
    setCatalogueR2();
    getItemMock.mockResolvedValue({
      id: "item-1",
      imageKey: "currencies-conf.png",
    });
    countOfficialRowsWithCatalogueImageKeyMock.mockResolvedValue(0);
    const { DELETE } = await import("@/app/api/items/[id]/route");

    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "item-1" })
    );
    expect(response.status).toBe(204);
    expect(s3SendMock).not.toHaveBeenCalled();
    expect(countOfficialRowsWithCatalogueImageKeyMock).not.toHaveBeenCalled();
  });

  it("DELETE returns 500 when delete fails", async () => {
    deleteItemMock.mockRejectedValue(new Error("db fail"));
    const { DELETE } = await import("@/app/api/items/[id]/route");

    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "item-1" })
    );
    expect(response.status).toBe(500);
  });
});
