import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const acceptGameInviteMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  acceptGameInvite: acceptGameInviteMock,
}));

describe("/api/games/[id]/invites/accept POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/games/[id]/invites/accept/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest(),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid game id", async () => {
    const { POST } = await import("@/app/api/games/[id]/invites/accept/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 when invite not found or already used", async () => {
    acceptGameInviteMock.mockResolvedValue(false);
    const { POST } = await import("@/app/api/games/[id]/invites/accept/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(404);
  });

  it("returns 200 when invite is accepted", async () => {
    acceptGameInviteMock.mockResolvedValue(true);
    const { POST } = await import("@/app/api/games/[id]/invites/accept/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
    expect(acceptGameInviteMock).toHaveBeenCalledWith("g-1", "user-1");
    await expect(response.json()).resolves.toEqual({ success: true });
  });
});
