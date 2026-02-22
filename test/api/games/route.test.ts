import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeRoute, makeAuthedRequest, makeUnauthedRequest } from "../helpers";

const createGameMock = vi.fn();
const getUserGamesMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  createGame: createGameMock,
  getUserGames: getUserGamesMock,
}));

vi.mock("@/app/lib/types/game", () => ({
  gameCreateSchema: { safeParse: safeParseMock },
}));

describe("/api/games handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 for unauthenticated requests", async () => {
    const { GET } = await import("@/app/api/games/route");
    const response = await invokeRoute(GET, makeUnauthedRequest());
    expect(response.status).toBe(401);
  });

  it("GET returns 200 with user games", async () => {
    getUserGamesMock.mockResolvedValue([{ id: "g-1" }]);
    const { GET } = await import("@/app/api/games/route");
    const response = await invokeRoute(GET, makeAuthedRequest(undefined, "user-1"));
    expect(response.status).toBe(200);
  });

  it("POST returns 400 for invalid payload", async () => {
    safeParseMock.mockReturnValue({
      data: undefined,
      error: { issues: [{ message: "invalid game payload" }] },
    });
    const { POST } = await import("@/app/api/games/route");
    const response = await invokeRoute(POST, makeAuthedRequest({ bad: true }, "user-1"));
    expect(response.status).toBe(400);
  });

  it("POST returns 201 when game is created", async () => {
    safeParseMock.mockReturnValue({
      data: { name: "Session 1" },
      error: undefined,
    });
    createGameMock.mockResolvedValue({ id: "g-1" });
    const { POST } = await import("@/app/api/games/route");
    const response = await invokeRoute(POST, makeAuthedRequest({ name: "Session 1" }, "user-1"));
    expect(response.status).toBe(201);
    expect(createGameMock).toHaveBeenCalled();
  });
});
