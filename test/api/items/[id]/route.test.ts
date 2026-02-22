import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../helpers";

const getItemMock = vi.fn();
const updateItemMock = vi.fn();
const deleteItemMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/item", () => ({
  getItem: getItemMock,
  updateItem: updateItemMock,
  deleteItem: deleteItemMock,
}));

vi.mock("@/app/lib/types/item", () => ({
  itemUpdateSchema: { safeParse: safeParseMock },
}));

describe("/api/items/[id] route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(updateItemMock).toHaveBeenCalledWith("item-1", { name: "Updated" });
  });

  it("DELETE returns 204 on success", async () => {
    deleteItemMock.mockResolvedValue(undefined);
    const { DELETE } = await import("@/app/api/items/[id]/route");

    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "item-1" })
    );
    expect(response.status).toBe(204);
    expect(deleteItemMock).toHaveBeenCalledWith("item-1");
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
