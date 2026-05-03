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

/** Dynamic route param is still `characterId` but value is `TYPE:id`. */
const combatantParam = (id: string) => `CHARACTER:${id}`;

const charEntry = (
  combatantId: string,
  overrides: Partial<{
    rolledValue: number;
    initiativeModifier: number;
    submittedAt: Date;
    combatantName: string;
  }> = {}
) => ({
  combatantType: "CHARACTER" as const,
  combatantId,
  combatantName: overrides.combatantName ?? "Hero",
  rolledValue: overrides.rolledValue ?? 5,
  initiativeModifier: overrides.initiativeModifier ?? 2,
  submittedAt: overrides.submittedAt ?? new Date(),
});

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
        makeParams({ id: "g-1", characterId: combatantParam("c-1") })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when caller is not game master", async () => {
      getGameWithDetailsMock.mockResolvedValue({
        id: "g-1",
        gameMaster: "gm-1",
        initiativeOrder: [charEntry("c-1")],
        characters: [],
      });
      const { DELETE } = await import(
        "@/app/api/games/[id]/initiative/[characterId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "user-2"),
        makeParams({ id: "g-1", characterId: combatantParam("c-1") })
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
            charEntry("c-1", { rolledValue: 5, initiativeModifier: 2 }),
            charEntry("c-2", {
              rolledValue: 3,
              initiativeModifier: 1,
              combatantName: "Other",
            }),
          ],
          characters: [],
        })
        .mockResolvedValueOnce({
          id: "g-1",
          gameMaster: "gm-1",
          initiativeOrder: [
            charEntry("c-2", {
              rolledValue: 3,
              initiativeModifier: 1,
              combatantName: "Other",
            }),
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
        makeParams({ id: "g-1", characterId: combatantParam("c-1") })
      );
      expect(response.status).toBe(200);
      expect(updateGameMock).toHaveBeenCalledWith("g-1", {
        initiativeOrder: [
          expect.objectContaining({
            combatantType: "CHARACTER",
            combatantId: "c-2",
            rolledValue: 3,
            initiativeModifier: 1,
          }),
        ],
      });
    });
  });

  describe("PATCH", () => {
    it("returns 401 when unauthenticated", async () => {
      const { PATCH } = await import(
        "@/app/api/games/[id]/initiative/[characterId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeUnauthedRequest({ initiativeDelta: 1 }),
        makeParams({ id: "g-1", characterId: combatantParam("c-1") })
      );
      expect(response.status).toBe(401);
      expect(getGameWithDetailsMock).not.toHaveBeenCalled();
      expect(updateGameMock).not.toHaveBeenCalled();
    });

    it("returns 400 when user id is missing", async () => {
      const { PATCH } = await import(
        "@/app/api/games/[id]/initiative/[characterId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        {
          auth: { user: {} },
          json: vi.fn().mockResolvedValue({ initiativeDelta: 1 }),
        } as any,
        makeParams({ id: "g-1", characterId: combatantParam("c-1") })
      );
      expect(response.status).toBe(400);
      expect(getGameWithDetailsMock).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid game id param", async () => {
      const { PATCH } = await import(
        "@/app/api/games/[id]/initiative/[characterId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ initiativeDelta: 1 }, "gm-1"),
        makeParams({ id: "", characterId: combatantParam("c-1") })
      );
      expect(response.status).toBe(400);
      expect(getGameWithDetailsMock).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid character id param", async () => {
      const { PATCH } = await import(
        "@/app/api/games/[id]/initiative/[characterId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ initiativeDelta: 1 }, "gm-1"),
        makeParams({ id: "g-1", characterId: "" })
      );
      expect(response.status).toBe(400);
      expect(getGameWithDetailsMock).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid request body", async () => {
      const { PATCH } = await import(
        "@/app/api/games/[id]/initiative/[characterId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ initiativeDelta: 0 }, "gm-1"),
        makeParams({ id: "g-1", characterId: combatantParam("c-1") })
      );
      expect(response.status).toBe(400);
      expect(getGameWithDetailsMock).not.toHaveBeenCalled();
      expect(updateGameMock).not.toHaveBeenCalled();
    });

    it("returns 404 when game does not exist", async () => {
      getGameWithDetailsMock.mockResolvedValue(null);
      const { PATCH } = await import(
        "@/app/api/games/[id]/initiative/[characterId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ initiativeDelta: 1 }, "gm-1"),
        makeParams({ id: "g-1", characterId: combatantParam("c-1") })
      );
      expect(response.status).toBe(404);
      expect(updateGameMock).not.toHaveBeenCalled();
    });

    it("returns 403 when caller is not game master", async () => {
      getGameWithDetailsMock.mockResolvedValue({
        id: "g-1",
        gameMaster: "gm-1",
        initiativeOrder: [],
        characters: [],
      });
      const { PATCH } = await import(
        "@/app/api/games/[id]/initiative/[characterId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ initiativeDelta: 1 }, "user-2"),
        makeParams({ id: "g-1", characterId: combatantParam("c-1") })
      );
      expect(response.status).toBe(403);
      expect(updateGameMock).not.toHaveBeenCalled();
    });

    it("returns 404 when initiative entry does not exist", async () => {
      getGameWithDetailsMock.mockResolvedValue({
        id: "g-1",
        gameMaster: "gm-1",
        initiativeOrder: [charEntry("c-2")],
        characters: [],
      });
      const { PATCH } = await import(
        "@/app/api/games/[id]/initiative/[characterId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ initiativeDelta: 1 }, "gm-1"),
        makeParams({ id: "g-1", characterId: combatantParam("c-1") })
      );
      expect(response.status).toBe(404);
      expect(updateGameMock).not.toHaveBeenCalled();
    });

    it("updates entry initiative modifier when game master", async () => {
      const submittedAt = new Date();
      const c2Submitted = new Date();
      getGameWithDetailsMock
        .mockResolvedValueOnce({
          id: "g-1",
          gameMaster: "gm-1",
          initiativeOrder: [
            charEntry("c-1", {
              rolledValue: 5,
              initiativeModifier: 2,
              submittedAt,
            }),
            charEntry("c-2", {
              rolledValue: 4,
              initiativeModifier: 1,
              combatantName: "Other",
              submittedAt: c2Submitted,
            }),
          ],
          characters: [],
        })
        .mockResolvedValueOnce({
          id: "g-1",
          gameMaster: "gm-1",
          initiativeOrder: [
            charEntry("c-1", {
              rolledValue: 5,
              initiativeModifier: 3,
              submittedAt,
            }),
            charEntry("c-2", {
              rolledValue: 4,
              initiativeModifier: 1,
              combatantName: "Other",
              submittedAt: c2Submitted,
            }),
          ],
          characters: [],
        });
      updateGameMock.mockResolvedValue(undefined);

      const { PATCH } = await import(
        "@/app/api/games/[id]/initiative/[characterId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ initiativeDelta: 1 }, "gm-1"),
        makeParams({ id: "g-1", characterId: combatantParam("c-1") })
      );

      expect(response.status).toBe(200);
      expect(updateGameMock).toHaveBeenCalledWith("g-1", {
        initiativeOrder: [
          expect.objectContaining({
            combatantType: "CHARACTER",
            combatantId: "c-1",
            rolledValue: 5,
            initiativeModifier: 3,
            submittedAt,
          }),
          expect.objectContaining({
            combatantType: "CHARACTER",
            combatantId: "c-2",
            rolledValue: 4,
            initiativeModifier: 1,
          }),
        ],
      });
    });

    it("returns 500 when game disappears after update", async () => {
      getGameWithDetailsMock
        .mockResolvedValueOnce({
          id: "g-1",
          gameMaster: "gm-1",
          initiativeOrder: [charEntry("c-1")],
          characters: [],
        })
        .mockResolvedValueOnce(null);
      updateGameMock.mockResolvedValue(undefined);

      const { PATCH } = await import(
        "@/app/api/games/[id]/initiative/[characterId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ initiativeDelta: -1 }, "gm-1"),
        makeParams({ id: "g-1", characterId: combatantParam("c-1") })
      );

      expect(response.status).toBe(500);
    });

    it("returns 500 when an unexpected error is thrown", async () => {
      getGameWithDetailsMock.mockRejectedValue(new Error("db fail"));
      const { PATCH } = await import(
        "@/app/api/games/[id]/initiative/[characterId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ initiativeDelta: 1 }, "gm-1"),
        makeParams({ id: "g-1", characterId: combatantParam("c-1") })
      );
      expect(response.status).toBe(500);
    });
  });
});
