import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameWithDetailsMock = vi.fn();
const updateGameMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGameWithDetails: getGameWithDetailsMock,
  updateGame: updateGameMock,
}));

describe("/api/games/[id]/initiative/[characterId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DELETE", () => {
    it("returns 401 when unauthenticated", async () => {
      const { DELETE } = await import(
        "@/app/api/games/[id]/initiative/[characterId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeUnauthedRequest(),
        makeParams({ id: "g-1", characterId: "c-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when caller is not game master", async () => {
      getGameWithDetailsMock.mockResolvedValue({
        id: "g-1",
        gameMaster: "gm-1",
        initiativeOrder: [
          {
            characterId: "c-1",
            rolledValue: 5,
            initiativeModifier: 2,
            submittedAt: new Date(),
          },
        ],
        characters: [],
      });
      const { DELETE } = await import(
        "@/app/api/games/[id]/initiative/[characterId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "user-2"),
        makeParams({ id: "g-1", characterId: "c-1" })
      );
      expect(response.status).toBe(403);
      expect(updateGameMock).not.toHaveBeenCalled();
    });

    it("removes one entry when game master", async () => {
      getGameWithDetailsMock
        .mockResolvedValueOnce({
          id: "g-1",
          gameMaster: "gm-1",
          initiativeOrder: [
            {
              characterId: "c-1",
              rolledValue: 5,
              initiativeModifier: 2,
              submittedAt: new Date(),
            },
            {
              characterId: "c-2",
              rolledValue: 3,
              initiativeModifier: 1,
              submittedAt: new Date(),
            },
          ],
          characters: [],
        })
        .mockResolvedValueOnce({
          id: "g-1",
          gameMaster: "gm-1",
          initiativeOrder: [
            {
              characterId: "c-2",
              rolledValue: 3,
              initiativeModifier: 1,
              submittedAt: new Date(),
            },
          ],
          characters: [],
        });
      updateGameMock.mockResolvedValue(undefined);
      const { DELETE } = await import(
        "@/app/api/games/[id]/initiative/[characterId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1", characterId: "c-1" })
      );
      expect(response.status).toBe(200);
      expect(updateGameMock).toHaveBeenCalledWith("g-1", {
        initiativeOrder: [
          {
            characterId: "c-2",
            rolledValue: 3,
            initiativeModifier: 1,
            submittedAt: expect.any(Date),
          },
        ],
      });
    });
  });
});
