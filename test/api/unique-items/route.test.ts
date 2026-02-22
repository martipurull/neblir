import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeRoute, makeAuthedRequest, makeUnauthedRequest } from "../helpers";

const createUniqueItemMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/uniqueItem", () => ({
  createUniqueItem: createUniqueItemMock,
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

  it("returns 201 and creates unique item on success", async () => {
    safeParseMock.mockReturnValue({
      data: { sourceType: "GLOBAL_ITEM", itemId: "item-1" },
      error: undefined,
    });
    createUniqueItemMock.mockResolvedValue({ id: "u-1" });
    const { POST } = await import("@/app/api/unique-items/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ sourceType: "GLOBAL_ITEM", itemId: "item-1" })
    );
    expect(response.status).toBe(201);
    expect(createUniqueItemMock).toHaveBeenCalled();
  });
});
