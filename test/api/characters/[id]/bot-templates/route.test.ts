import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const playControlMock = vi.fn();
const getBotsMock = vi.fn();

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  userHasPlayControl: (...args: unknown[]) => playControlMock(...args),
}));

vi.mock("@/app/lib/prisma/bot", () => ({
  getBots: (...args: unknown[]) => getBotsMock(...args),
}));

const catalogue = [
  { id: "bot-player", accessType: "PLAYER", name: "Loader" },
  { id: "bot-gm", accessType: "GAME_MASTER", name: "Black Frame" },
];

describe("/api/characters/[id]/bot-templates handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    playControlMock.mockResolvedValue(true);
    getBotsMock.mockResolvedValue(catalogue);
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } =
      await import("@/app/api/characters/[id]/bot-templates/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(401);
    expect(getBotsMock).not.toHaveBeenCalled();
  });

  it("GET returns 403 when the user lacks play control", async () => {
    playControlMock.mockResolvedValue(false);
    const { GET } =
      await import("@/app/api/characters/[id]/bot-templates/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(403);
    expect(getBotsMock).not.toHaveBeenCalled();
  });

  it("GET returns GM-only Official bots to someone with play control", async () => {
    const { GET } =
      await import("@/app/api/characters/[id]/bot-templates/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(catalogue);
  });
});
