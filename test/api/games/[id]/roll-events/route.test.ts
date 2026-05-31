import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const userIsInGameMock = vi.fn();
const getGameMock = vi.fn();
const characterIsInGameMock = vi.fn();
const userOwnsCharacterMock = vi.fn();

const prismaMocks = vi.hoisted(() => ({
  discordIntegration: { findUnique: vi.fn() },
  rollEvent: { create: vi.fn() },
  discordOutbox: { create: vi.fn() },
}));

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  characterIsInGame: characterIsInGameMock,
  userOwnsCharacter: userOwnsCharacterMock,
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: prismaMocks,
}));

describe("/api/games/[id]/roll-events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsInGameMock.mockResolvedValue(true);
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    characterIsInGameMock.mockResolvedValue(true);
    userOwnsCharacterMock.mockResolvedValue(true);
    prismaMocks.discordIntegration.findUnique.mockResolvedValue(null);
    prismaMocks.rollEvent.create.mockResolvedValue({ id: "re-1" });
    prismaMocks.discordOutbox.create.mockResolvedValue({});
  });

  describe("POST", () => {
    it("returns 401 when unauthenticated", async () => {
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeUnauthedRequest(),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when caller is not part of the game", async () => {
      userIsInGameMock.mockResolvedValue(false);
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            diceExpression: "2d10",
            results: [10, 7],
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
    });

    it("persists isPrivate=true into roll metadata", async () => {
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            isPrivate: true,
            rollType: "GENERAL_ROLL",
            diceExpression: "2d10",
            results: [10, 7],
            metadata: { label1: "Agility", label2: "Stealth" },
          },
          "gm-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);

      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            label1: "Agility",
            label2: "Stealth",
            isPrivate: true,
          }),
        }),
      });
    });
  });
});
