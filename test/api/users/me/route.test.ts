import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../../helpers";

const getUserMock = vi.fn();
const deleteUserMock = vi.fn();

vi.mock("@/app/lib/prisma/user", () => ({
  getUser: getUserMock,
  deleteUser: deleteUserMock,
}));

describe("/api/users/me handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/users/me/route");
    const response = await invokeRoute(GET, makeUnauthedRequest());
    expect(response.status).toBe(401);
  });

  it("GET returns 404 when user does not exist", async () => {
    getUserMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/users/me/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1")
    );
    expect(response.status).toBe(404);
  });

  it("GET returns 200 with frontend-safe user payload", async () => {
    getUserMock.mockResolvedValue({
      id: "user-1",
      name: "Taylor",
      email: "taylor@example.com",
      characters: [],
      games: [],
    });
    const { GET } = await import("@/app/api/users/me/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1")
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      name: "Taylor",
      email: "taylor@example.com",
    });
  });

  it("GET returns 500 when fetching user throws", async () => {
    getUserMock.mockRejectedValue(new Error("db down"));
    const { GET } = await import("@/app/api/users/me/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1")
    );
    expect(response.status).toBe(500);
  });

  it("DELETE returns 401 when unauthenticated", async () => {
    const { DELETE } = await import("@/app/api/users/me/route");
    const response = await invokeRoute(DELETE, makeUnauthedRequest());
    expect(response.status).toBe(401);
  });

  it("DELETE returns 204 on success", async () => {
    deleteUserMock.mockResolvedValue(undefined);
    const { DELETE } = await import("@/app/api/users/me/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-123")
    );
    expect(deleteUserMock).toHaveBeenCalledWith("user-123");
    expect(response.status).toBe(204);
  });

  it("DELETE returns 500 when deletion throws", async () => {
    deleteUserMock.mockRejectedValue(new Error("delete failed"));
    const { DELETE } = await import("@/app/api/users/me/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1")
    );
    expect(response.status).toBe(500);
  });
});
