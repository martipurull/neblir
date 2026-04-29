import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const userIsInGameMock = vi.fn();
const getGameMock = vi.fn();
const getGameRecapsMock = vi.fn();
const createGameRecapMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  userIsInGame: userIsInGameMock,
  getGame: getGameMock,
}));

vi.mock("@/app/lib/prisma/gameRecap", () => ({
  getGameRecaps: getGameRecapsMock,
  createGameRecap: createGameRecapMock,
}));

describe("GET /api/games/[id]/recaps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/games/[id]/recaps/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when user is not part of the game", async () => {
    userIsInGameMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/games/[id]/recaps/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "u-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
    expect(getGameRecapsMock).not.toHaveBeenCalled();
  });

  it("returns recaps for game members", async () => {
    userIsInGameMock.mockResolvedValue(true);
    getGameRecapsMock.mockResolvedValue([{ id: "r-1", title: "Session 1" }]);
    const { GET } = await import("@/app/api/games/[id]/recaps/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "u-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([{ id: "r-1", title: "Session 1" }]);
    expect(getGameRecapsMock).toHaveBeenCalledWith("g-1");
  });
});

describe("POST /api/games/[id]/recaps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/games/[id]/recaps/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({}),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when game does not exist", async () => {
    getGameMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/games/[id]/recaps/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          title: "Session 1",
          fileKey: "recaps-s1.pdf",
          fileName: "s1.pdf",
          fileSizeBytes: 1234,
        },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(404);
    expect(createGameRecapMock).not.toHaveBeenCalled();
  });

  it("returns 403 when requester is not GM", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/games/[id]/recaps/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          title: "Session 1",
          fileKey: "recaps-s1.pdf",
          fileName: "s1.pdf",
          fileSizeBytes: 1234,
        },
        "u-2"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
    expect(createGameRecapMock).not.toHaveBeenCalled();
  });

  it("creates recap when requester is GM", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    createGameRecapMock.mockResolvedValue({
      id: "r-1",
      gameId: "g-1",
      title: "Session 1",
    });
    const { POST } = await import("@/app/api/games/[id]/recaps/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          title: "Session 1",
          summary: "Summary",
          fileKey: "recaps-s1.pdf",
          fileName: "s1.pdf",
          fileSizeBytes: 1234,
        },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(201);
    expect(createGameRecapMock).toHaveBeenCalledWith({
      gameId: "g-1",
      title: "Session 1",
      summary: "Summary",
      fileKey: "recaps-s1.pdf",
      fileName: "s1.pdf",
      fileSizeBytes: 1234,
      uploadedByUserId: "gm-1",
    });
  });

  it("returns field-specific validation errors for invalid body", async () => {
    getGameMock.mockResolvedValue({ gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/games/[id]/recaps/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          title: "Session 1",
          fileName: "s1.pdf",
          fileSizeBytes: 1234,
        },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { message: string };
    expect(body.message).toContain("Invalid recap data");
    expect(body.message).toContain("fileKey");
    expect(createGameRecapMock).not.toHaveBeenCalled();
  });
});
