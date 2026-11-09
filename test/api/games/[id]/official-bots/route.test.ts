import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getGameMock = vi.fn();
const getBotsMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: (...args: unknown[]) => getGameMock(...args),
}));

vi.mock("@/app/lib/prisma/bot", () => ({
  getBots: (...args: unknown[]) => getBotsMock(...args),
}));

const catalogue = [
  {
    id: "bot-player",
    accessType: "PLAYER" as const,
    name: "Loader",
    maxHp: 12,
  },
  {
    id: "bot-gm",
    accessType: "GAME_MASTER" as const,
    name: "Black Frame",
    maxHp: 30,
  },
];

describe("/api/games/[id]/official-bots handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    getBotsMock.mockResolvedValue(catalogue);
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/games/[id]/official-bots/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
    expect(getBotsMock).not.toHaveBeenCalled();
  });

  it("GET returns 404 when the game does not exist", async () => {
    getGameMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/games/[id]/official-bots/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "missing" })
    );
    expect(response.status).toBe(404);
    expect(getBotsMock).not.toHaveBeenCalled();
  });

  it("GET returns 403 when a player asks for the game master's catalogue", async () => {
    const { GET } = await import("@/app/api/games/[id]/official-bots/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "player-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
    expect(getBotsMock).not.toHaveBeenCalled();
  });

  it("GET returns player and GM-only official bots to the game master", async () => {
    const { GET } = await import("@/app/api/games/[id]/official-bots/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(catalogue);
    expect(getBotsMock).toHaveBeenCalledOnce();
  });
});
