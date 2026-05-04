import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getGameWithDetailsMock = vi.fn();
const updateGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const characterIsInGameMock = vi.fn();
const userOwnsCharacterMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGameWithDetails: getGameWithDetailsMock,
  updateGame: updateGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  characterIsInGame: characterIsInGameMock,
  userOwnsCharacter: userOwnsCharacterMock,
}));

describe("/api/games/[id]/initiative", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const gameCharacterC1 = {
    character: {
      id: "c-1",
      generalInformation: { name: "Hero", surname: "" },
      combatInformation: {},
      users: [{ userId: "user-1" }],
    },
  };

  const baseGame = {
    id: "g-1",
    gameMaster: "gm-1",
    name: "Game",
    users: [],
    characters: [gameCharacterC1],
    customItems: [],
    initiativeOrder: [],
  };

  describe("POST", () => {
    it("returns 401 when unauthenticated", async () => {
      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeUnauthedRequest({}),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when user is not in game", async () => {
      userIsInGameMock.mockResolvedValue(false);
      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            combatantType: "CHARACTER",
            combatantId: "c-1",
            rolledValue: 15,
            initiativeModifier: 2,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
    });

    it("returns 409 when character already submitted", async () => {
      userIsInGameMock.mockResolvedValue(true);
      getGameWithDetailsMock.mockResolvedValue({
        ...baseGame,
        initiativeOrder: [
          {
            combatantType: "CHARACTER" as const,
            combatantId: "c-1",
            combatantName: "Hero",
            rolledValue: 10,
            initiativeModifier: 2,
            submittedAt: new Date(),
          },
        ],
      });
      characterIsInGameMock.mockResolvedValue(true);
      userOwnsCharacterMock.mockResolvedValue(true);
      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            combatantType: "CHARACTER",
            combatantId: "c-1",
            rolledValue: 15,
            initiativeModifier: 2,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(409);
      expect(updateGameMock).not.toHaveBeenCalled();
    });

    it("returns 201 and appends initiative when valid", async () => {
      userIsInGameMock.mockResolvedValue(true);
      getGameWithDetailsMock
        .mockResolvedValueOnce({ ...baseGame, initiativeOrder: [] })
        .mockResolvedValueOnce({
          ...baseGame,
          initiativeOrder: [
            {
              combatantType: "CHARACTER" as const,
              combatantId: "c-1",
              combatantName: "Hero",
              rolledValue: 15,
              initiativeModifier: 2,
              submittedAt: new Date("2025-01-01T12:00:00Z"),
            },
          ],
        });
      characterIsInGameMock.mockResolvedValue(true);
      userOwnsCharacterMock.mockResolvedValue(true);
      updateGameMock.mockResolvedValue(undefined);
      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            combatantType: "CHARACTER",
            combatantId: "c-1",
            rolledValue: 15,
            initiativeModifier: 2,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);
      expect(updateGameMock).toHaveBeenCalledWith("g-1", {
        initiativeOrder: expect.arrayContaining([
          expect.objectContaining({
            combatantType: "CHARACTER",
            combatantId: "c-1",
            rolledValue: 15,
            initiativeModifier: 2,
          }),
        ]),
      });
    });
  });

  describe("DELETE", () => {
    it("returns 403 when caller is not game master", async () => {
      getGameWithDetailsMock.mockResolvedValue({
        ...baseGame,
        gameMaster: "gm-1",
      });
      const { DELETE } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "user-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
      expect(updateGameMock).not.toHaveBeenCalled();
    });

    it("clears initiative when game master", async () => {
      getGameWithDetailsMock
        .mockResolvedValueOnce({
          ...baseGame,
          gameMaster: "gm-1",
          initiativeOrder: [
            {
              combatantType: "CHARACTER" as const,
              combatantId: "c-1",
              combatantName: "Hero",
              rolledValue: 10,
              initiativeModifier: 0,
              submittedAt: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce({
          ...baseGame,
          gameMaster: "gm-1",
          initiativeOrder: [],
        });
      updateGameMock.mockResolvedValue(undefined);
      const { DELETE } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(200);
      expect(updateGameMock).toHaveBeenCalledWith("g-1", {
        initiativeOrder: [],
      });
    });
  });
});
