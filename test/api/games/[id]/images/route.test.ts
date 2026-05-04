import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const userIsInGameMock = vi.fn();
const getGameMock = vi.fn();
const getGameImagesMock = vi.fn();
const createGameImageMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  userIsInGame: userIsInGameMock,
  getGame: getGameMock,
}));

vi.mock("@/app/lib/prisma/gameImage", () => ({
  getGameImages: getGameImagesMock,
  createGameImage: createGameImageMock,
}));

describe("GET /api/games/[id]/images", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/games/[id]/images/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when user is not in game", async () => {
    userIsInGameMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/games/[id]/images/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "u-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
  });

  it("returns images for game members", async () => {
    userIsInGameMock.mockResolvedValue(true);
    getGameImagesMock.mockResolvedValue([{ id: "img-1", title: "Reference" }]);
    const { GET } = await import("@/app/api/games/[id]/images/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "u-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { id: "img-1", title: "Reference" },
    ]);
  });
});

describe("POST /api/games/[id]/images", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when requester is not GM", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/games/[id]/images/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { title: "Ref", imageKey: "games-ref-1.png", description: "desc" },
        "u-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
  });

  it("creates image when requester is GM", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    createGameImageMock.mockResolvedValue({ id: "img-1" });
    const { POST } = await import("@/app/api/games/[id]/images/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { title: "Ref", imageKey: "games-ref-1.png", description: "desc" },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(201);
    expect(createGameImageMock).toHaveBeenCalledWith({
      gameId: "g-1",
      title: "Ref",
      description: "desc",
      imageKey: "games-ref-1.png",
      uploadedByUserId: "gm-1",
    });
  });
});
