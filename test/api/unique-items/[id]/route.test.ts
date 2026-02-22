import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../helpers";

const getResolvedUniqueItemMock = vi.fn();
const getUniqueItemMock = vi.fn();
const updateUniqueItemMock = vi.fn();
const deleteUniqueItemMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/uniqueItem", () => ({
  getResolvedUniqueItem: getResolvedUniqueItemMock,
  getUniqueItem: getUniqueItemMock,
  updateUniqueItem: updateUniqueItemMock,
  deleteUniqueItem: deleteUniqueItemMock,
}));

vi.mock("@/app/lib/types/item", () => ({
  uniqueItemUpdateSchema: { safeParse: safeParseMock },
}));

describe("/api/unique-items/[id] route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/unique-items/[id]/route");
    const response = await invokeRoute(GET, makeUnauthedRequest(), makeParams({ id: "u-1" }));
    expect(response.status).toBe(401);
  });

  it("GET returns 404 when item does not exist", async () => {
    getResolvedUniqueItemMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/unique-items/[id]/route");
    const response = await invokeRoute(GET, makeAuthedRequest(), makeParams({ id: "u-1" }));
    expect(response.status).toBe(404);
  });

  it("PATCH returns 400 on invalid body", async () => {
    getUniqueItemMock.mockResolvedValue({ id: "u-1" });
    safeParseMock.mockReturnValue({
      error: { issues: [{ message: "invalid patch" }] },
      data: undefined,
    });
    const { PATCH } = await import("@/app/api/unique-items/[id]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ bad: true }),
      makeParams({ id: "u-1" })
    );
    expect(response.status).toBe(400);
  });

  it("PATCH returns 200 on success", async () => {
    getUniqueItemMock.mockResolvedValue({ id: "u-1" });
    safeParseMock.mockReturnValue({ data: { notesOverride: "ok" }, error: undefined });
    updateUniqueItemMock.mockResolvedValue({ id: "u-1", notesOverride: "ok" });
    const { PATCH } = await import("@/app/api/unique-items/[id]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ notesOverride: "ok" }),
      makeParams({ id: "u-1" })
    );
    expect(response.status).toBe(200);
  });

  it("DELETE returns 204 on success", async () => {
    getUniqueItemMock.mockResolvedValue({ id: "u-1" });
    deleteUniqueItemMock.mockResolvedValue(undefined);
    const { DELETE } = await import("@/app/api/unique-items/[id]/route");

    const response = await invokeRoute(DELETE, makeAuthedRequest(), makeParams({ id: "u-1" }));
    expect(response.status).toBe(204);
  });
});
