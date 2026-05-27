import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const gameMasterCanViewGameCharacterMock = vi.fn();
const getCharacterMock = vi.fn();

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  gameMasterCanViewGameCharacter: gameMasterCanViewGameCharacterMock,
}));

vi.mock("@/app/lib/prisma/character", () => ({
  getCharacter: getCharacterMock,
}));

describe("GET /api/games/[id]/characters/[characterId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } =
      await import("@/app/api/games/[id]/characters/[characterId]/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "g-1", characterId: "c-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when caller cannot view as game master", async () => {
    gameMasterCanViewGameCharacterMock.mockResolvedValue(false);
    const { GET } =
      await import("@/app/api/games/[id]/characters/[characterId]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "g-1", characterId: "c-1" })
    );
    expect(response.status).toBe(403);
    expect(getCharacterMock).not.toHaveBeenCalled();
  });

  it("returns 404 when character does not exist", async () => {
    gameMasterCanViewGameCharacterMock.mockResolvedValue(true);
    getCharacterMock.mockResolvedValue(null);
    const { GET } =
      await import("@/app/api/games/[id]/characters/[characterId]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "g-1", characterId: "c-1" })
    );
    expect(response.status).toBe(404);
  });

  it("returns 200 with character without notes and read-only access flags", async () => {
    gameMasterCanViewGameCharacterMock.mockResolvedValue(true);
    getCharacterMock.mockResolvedValue({
      id: "c-1",
      generalInformation: { name: "Nova", surname: "Voss", level: 2 },
      health: {},
      combatInformation: {},
      innateAttributes: {},
      learnedSkills: { generalSkills: {}, specialSkills: [] },
      wallet: [],
      inventory: [],
      notes: [{ content: "secret", createdAt: "t", updatedAt: "t" }],
      paths: [],
      games: [{ gameId: "g-1", game: { id: "g-1", name: "Campaign" } }],
    });
    const { GET } =
      await import("@/app/api/games/[id]/characters/[characterId]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "g-1", characterId: "c-1" })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe("c-1");
    expect(body.notes).toEqual([]);
    expect(body.access).toEqual({ canEdit: false, canRoll: false });
    expect(gameMasterCanViewGameCharacterMock).toHaveBeenCalledWith(
      "g-1",
      "c-1",
      "gm-1"
    );
  });
});
