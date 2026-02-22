import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const createItemMock = vi.fn();
const getItemsMock = vi.fn();
const safeParseMock = vi.fn();

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
  });

  it("POST returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/items/route");

    const response = await invokeRoute(POST, makeUnauthedRequest({}));
    expect(response.status).toBe(401);
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
    expect(createItemMock).toHaveBeenCalledWith({ name: "Sword" });
  });

  it("GET returns 200 with items for authenticated users", async () => {
    getItemsMock.mockResolvedValue([{ id: "item-1" }]);
    const { GET } = await import("@/app/api/items/route");

    const response = await invokeRoute(GET, makeAuthedRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([{ id: "item-1" }]);
  });
});
