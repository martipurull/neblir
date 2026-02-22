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
    safeParseMock.mockReturnValue({ data: { name: "new" }, error: undefined });
    updateUserMock.mockResolvedValue({ id: "user-1", name: "new" });
    const { PATCH } = await import("@/app/api/users/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({}, "user-1"),
      makeParams({ id: "user-1" })
    );
    expect(response.status).toBe(200);
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
