import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../helpers";

const getGameMock = vi.fn();
const updateGameMock = vi.fn();
const deleteGameMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  updateGame: updateGameMock,
  deleteGame: deleteGameMock,
}));

vi.mock("@/app/lib/types/game", () => ({
  gameUpdateSchema: { safeParse: safeParseMock },
}));

describe("/api/games/[id] handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 400 for invalid id", async () => {
    const { GET } = await import("@/app/api/games/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "" })
    );
    expect(response.status).toBe(400);
  });

  it("GET returns 404 when game does not exist", async () => {
    getGameMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/games/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(404);
  });

  it("PATCH returns 400 when payload is invalid", async () => {
    safeParseMock.mockReturnValue({
      data: undefined,
      error: { issues: [{ message: "invalid update" }] },
    });
    const { PATCH } = await import("@/app/api/games/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ bad: true }),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
  });

  it("PATCH returns 200 when update succeeds", async () => {
    safeParseMock.mockReturnValue({
      data: { name: "Updated" },
      error: undefined,
    });
    updateGameMock.mockResolvedValue({ id: "g-1", name: "Updated" });
    const { PATCH } = await import("@/app/api/games/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ name: "Updated" }),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
  });

  it("DELETE returns 204 on success", async () => {
    deleteGameMock.mockResolvedValue(undefined);
    const { DELETE } = await import("@/app/api/games/[id]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(204);
  });

  it("DELETE returns 401 when unauthenticated", async () => {
    const { DELETE } = await import("@/app/api/games/[id]/route");
    const response = await invokeRoute(
      DELETE,
      makeUnauthedRequest(),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
  });
});
