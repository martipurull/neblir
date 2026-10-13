import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../helpers";

const getUserMock = vi.fn();
const updateUserMock = vi.fn();
const deleteUserMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/user", () => ({
  getUser: getUserMock,
  updateUser: updateUserMock,
  deleteUser: deleteUserMock,
}));

vi.mock("@/app/lib/types/user", () => ({
  userUpdateSchema: { safeParse: safeParseMock },
}));

describe("/api/users/[id] handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 403 when user id mismatch", async () => {
    const { GET } = await import("@/app/api/users/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "user-2" })
    );
    expect(response.status).toBe(403);
  });

  it("GET returns 200 on success", async () => {
    getUserMock.mockResolvedValue({ id: "user-1" });
    const { GET } = await import("@/app/api/users/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "user-1" })
    );
    expect(response.status).toBe(200);
  });

  it("PATCH returns 400 when body is invalid", async () => {
    safeParseMock.mockReturnValue({
      data: undefined,
      error: { issues: [{ message: "invalid update" }] },
    });
    const { PATCH } = await import("@/app/api/users/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}, "user-1"),
      makeParams({ id: "user-1" })
    );
    expect(response.status).toBe(400);
  });

  it("PATCH returns 200 on success", async () => {
    safeParseMock.mockReturnValue({
      data: { name: "new", characterLayoutMode: "vertical" },
      error: undefined,
    });
    updateUserMock.mockResolvedValue({ id: "user-1", name: "new" });
    const { PATCH } = await import("@/app/api/users/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}, "user-1"),
      makeParams({ id: "user-1" })
    );
    expect(response.status).toBe(200);
    expect(updateUserMock).toHaveBeenCalledWith("user-1", {
      name: "new",
      characterLayoutMode: "VERTICAL",
    });
  });

  it("PATCH passes characterCarouselWrap through to db", async () => {
    safeParseMock.mockReturnValue({
      data: { characterCarouselWrap: false },
      error: undefined,
    });
    updateUserMock.mockResolvedValue({ id: "user-1" });
    const { PATCH } = await import("@/app/api/users/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}, "user-1"),
      makeParams({ id: "user-1" })
    );
    expect(response.status).toBe(200);
    expect(updateUserMock).toHaveBeenCalledWith("user-1", {
      characterCarouselWrap: false,
      characterLayoutMode: undefined,
    });
  });

  it("PATCH passes characterSectionOrder through to db", async () => {
    safeParseMock.mockReturnValue({
      data: { characterSectionOrder: ["inventory", "attributes", "skills"] },
      error: undefined,
    });
    updateUserMock.mockResolvedValue({ id: "user-1" });
    const { PATCH } = await import("@/app/api/users/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}, "user-1"),
      makeParams({ id: "user-1" })
    );
    expect(response.status).toBe(200);
    expect(updateUserMock).toHaveBeenCalledWith("user-1", {
      characterSectionOrder: ["inventory", "attributes", "skills"],
      characterLayoutMode: undefined,
    });
  });

  it("PATCH passes null characterSectionOrder through to db as empty array", async () => {
    safeParseMock.mockReturnValue({
      data: { characterSectionOrder: null },
      error: undefined,
    });
    updateUserMock.mockResolvedValue({ id: "user-1" });
    const { PATCH } = await import("@/app/api/users/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}, "user-1"),
      makeParams({ id: "user-1" })
    );
    expect(response.status).toBe(200);
    expect(updateUserMock).toHaveBeenCalledWith("user-1", {
      characterSectionOrder: [],
      characterLayoutMode: undefined,
    });
  });

  it("PATCH returns 401 when unauthenticated", async () => {
    const { PATCH } = await import("@/app/api/users/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeUnauthedRequest({ theme: "dark" }),
      makeParams({ id: "user-1" })
    );
    expect(response.status).toBe(401);
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 403 when updating another user's theme", async () => {
    const { PATCH } = await import("@/app/api/users/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ theme: "dark" }, "user-1"),
      makeParams({ id: "user-2" })
    );
    expect(response.status).toBe(403);
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("PATCH stores neblir, dark, and light as the db enum", async () => {
    const { PATCH } = await import("@/app/api/users/[id]/route");
    for (const [wire, stored] of [
      ["neblir", "NEBLIR"],
      ["dark", "DARK"],
      ["light", "LIGHT"],
    ] as const) {
      safeParseMock.mockReturnValue({
        data: { theme: wire },
        error: undefined,
      });
      updateUserMock.mockResolvedValue({ id: "user-1", theme: stored });
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ theme: wire }, "user-1"),
        makeParams({ id: "user-1" })
      );
      expect(response.status).toBe(200);
      expect(updateUserMock).toHaveBeenCalledWith("user-1", {
        theme: stored,
        characterLayoutMode: undefined,
        characterSectionOrder: undefined,
      });
    }
  });

  it("PATCH leaves theme unchanged when the field is omitted", async () => {
    safeParseMock.mockReturnValue({
      data: { name: "kept" },
      error: undefined,
    });
    updateUserMock.mockResolvedValue({ id: "user-1", name: "kept" });
    const { PATCH } = await import("@/app/api/users/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ name: "kept" }, "user-1"),
      makeParams({ id: "user-1" })
    );
    expect(response.status).toBe(200);
    const update = updateUserMock.mock.calls[0]?.[1] as { theme?: string };
    expect(update.theme).toBeUndefined();
    expect(updateUserMock).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ name: "kept" })
    );
  });

  it("PATCH passes null characterLayoutMode through to db", async () => {
    safeParseMock.mockReturnValue({
      data: { characterLayoutMode: null },
      error: undefined,
    });
    updateUserMock.mockResolvedValue({ id: "user-1" });
    const { PATCH } = await import("@/app/api/users/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}, "user-1"),
      makeParams({ id: "user-1" })
    );
    expect(response.status).toBe(200);
    expect(updateUserMock).toHaveBeenCalledWith("user-1", {
      characterLayoutMode: null,
    });
  });

  it("DELETE returns 204 on success", async () => {
    deleteUserMock.mockResolvedValue(undefined);
    const { DELETE } = await import("@/app/api/users/[id]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "user-1" })
    );
    expect(response.status).toBe(204);
  });

  it("DELETE returns 401 when unauthenticated", async () => {
    const { DELETE } = await import("@/app/api/users/[id]/route");
    const response = await invokeRoute(
      DELETE,
      makeUnauthedRequest(),
      makeParams({ id: "user-1" })
    );
    expect(response.status).toBe(401);
  });
});
