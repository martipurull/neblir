import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../../helpers";

const prismaMock = vi.hoisted(() => ({
  game: { findUnique: vi.fn() },
  gameUser: { findFirst: vi.fn(), findMany: vi.fn() },
  gameCharacter: { findFirst: vi.fn(), update: vi.fn() },
  characterUser: { findMany: vi.fn() },
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: prismaMock,
}));

function mockGmControlledNpc() {
  prismaMock.game.findUnique.mockResolvedValue({
    id: "g-1",
    gameMaster: "gm-1",
  });
  prismaMock.gameCharacter.findFirst.mockResolvedValue({
    id: "gc-1",
    gameId: "g-1",
    characterId: "c-1",
    playGrantUserId: null,
  });
  prismaMock.gameUser.findMany.mockResolvedValue([
    { userId: "gm-1" },
    { userId: "player-1" },
    { userId: "player-2" },
  ]);
  prismaMock.characterUser.findMany.mockResolvedValue([{ userId: "gm-1" }]);
}

describe("/api/games/[id]/characters/[characterId]/play-grant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.gameCharacter.update.mockResolvedValue({
      id: "gc-1",
      playGrantUserId: "player-1",
    });
  });

  describe("PUT", () => {
    it("returns 401 when unauthenticated", async () => {
      const { PUT } =
        await import("@/app/api/games/[id]/characters/[characterId]/play-grant/route");
      const response = await invokeRoute(
        PUT,
        makeUnauthedRequest({ userId: "player-1" }),
        makeParams({ id: "g-1", characterId: "c-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when the caller is not the game master", async () => {
      prismaMock.game.findUnique.mockResolvedValue({
        id: "g-1",
        gameMaster: "gm-1",
      });
      const { PUT } =
        await import("@/app/api/games/[id]/characters/[characterId]/play-grant/route");
      const response = await invokeRoute(
        PUT,
        makeAuthedRequest({ userId: "player-1" }, "player-2"),
        makeParams({ id: "g-1", characterId: "c-1" })
      );
      expect(response.status).toBe(403);
      expect(prismaMock.gameCharacter.update).not.toHaveBeenCalled();
    });

    it("returns 403 when granting a player character", async () => {
      prismaMock.game.findUnique.mockResolvedValue({
        id: "g-1",
        gameMaster: "gm-1",
      });
      prismaMock.gameCharacter.findFirst.mockResolvedValue({
        id: "gc-1",
        gameId: "g-1",
        characterId: "c-1",
        playGrantUserId: null,
      });
      prismaMock.gameUser.findMany.mockResolvedValue([
        { userId: "gm-1" },
        { userId: "player-1" },
      ]);
      prismaMock.characterUser.findMany.mockResolvedValue([
        { userId: "player-1" },
      ]);

      const { PUT } =
        await import("@/app/api/games/[id]/characters/[characterId]/play-grant/route");
      const response = await invokeRoute(
        PUT,
        makeAuthedRequest({ userId: "player-1" }, "gm-1"),
        makeParams({ id: "g-1", characterId: "c-1" })
      );
      expect(response.status).toBe(403);
      expect(prismaMock.gameCharacter.update).not.toHaveBeenCalled();
    });

    it("returns 403 when the grantee is the game master", async () => {
      mockGmControlledNpc();
      const { PUT } =
        await import("@/app/api/games/[id]/characters/[characterId]/play-grant/route");
      const response = await invokeRoute(
        PUT,
        makeAuthedRequest({ userId: "gm-1" }, "gm-1"),
        makeParams({ id: "g-1", characterId: "c-1" })
      );
      expect(response.status).toBe(403);
      expect(prismaMock.gameCharacter.update).not.toHaveBeenCalled();
    });

    it("returns 403 when the grantee is not a game member", async () => {
      mockGmControlledNpc();
      prismaMock.gameUser.findFirst.mockResolvedValue(null);
      const { PUT } =
        await import("@/app/api/games/[id]/characters/[characterId]/play-grant/route");
      const response = await invokeRoute(
        PUT,
        makeAuthedRequest({ userId: "outsider-1" }, "gm-1"),
        makeParams({ id: "g-1", characterId: "c-1" })
      );
      expect(response.status).toBe(403);
      expect(prismaMock.gameCharacter.update).not.toHaveBeenCalled();
    });

    it("issues a play grant", async () => {
      mockGmControlledNpc();
      prismaMock.gameUser.findFirst.mockResolvedValue({
        id: "gu-1",
        userId: "player-1",
      });
      const { PUT } =
        await import("@/app/api/games/[id]/characters/[characterId]/play-grant/route");
      const response = await invokeRoute(
        PUT,
        makeAuthedRequest({ userId: "player-1" }, "gm-1"),
        makeParams({ id: "g-1", characterId: "c-1" })
      );
      expect(response.status).toBe(200);
      expect(prismaMock.gameCharacter.update).toHaveBeenCalledWith({
        where: { id: "gc-1" },
        data: { playGrantUserId: "player-1" },
      });
      const body = await response.json();
      expect(body.playGrantUserId).toBe("player-1");
    });

    it("replaces an existing play grant", async () => {
      mockGmControlledNpc();
      prismaMock.gameCharacter.findFirst.mockResolvedValue({
        id: "gc-1",
        gameId: "g-1",
        characterId: "c-1",
        playGrantUserId: "player-1",
      });
      prismaMock.gameUser.findFirst.mockResolvedValue({
        id: "gu-2",
        userId: "player-2",
      });
      prismaMock.gameCharacter.update.mockResolvedValue({
        id: "gc-1",
        playGrantUserId: "player-2",
      });

      const { PUT } =
        await import("@/app/api/games/[id]/characters/[characterId]/play-grant/route");
      const response = await invokeRoute(
        PUT,
        makeAuthedRequest({ userId: "player-2" }, "gm-1"),
        makeParams({ id: "g-1", characterId: "c-1" })
      );
      expect(response.status).toBe(200);
      expect(prismaMock.gameCharacter.update).toHaveBeenCalledWith({
        where: { id: "gc-1" },
        data: { playGrantUserId: "player-2" },
      });
      const body = await response.json();
      expect(body.playGrantUserId).toBe("player-2");
    });

    it("returns 400 when the body has no grantee userId", async () => {
      const { PUT } =
        await import("@/app/api/games/[id]/characters/[characterId]/play-grant/route");
      const response = await invokeRoute(
        PUT,
        makeAuthedRequest({}, "gm-1"),
        makeParams({ id: "g-1", characterId: "c-1" })
      );
      expect(response.status).toBe(400);
      expect(prismaMock.gameCharacter.update).not.toHaveBeenCalled();
    });

    it("returns 404 when the game does not exist", async () => {
      prismaMock.game.findUnique.mockResolvedValue(null);
      const { PUT } =
        await import("@/app/api/games/[id]/characters/[characterId]/play-grant/route");
      const response = await invokeRoute(
        PUT,
        makeAuthedRequest({ userId: "player-1" }, "gm-1"),
        makeParams({ id: "g-1", characterId: "c-1" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 404 when the character is not linked", async () => {
      prismaMock.game.findUnique.mockResolvedValue({
        id: "g-1",
        gameMaster: "gm-1",
      });
      prismaMock.gameCharacter.findFirst.mockResolvedValue(null);
      const { PUT } =
        await import("@/app/api/games/[id]/characters/[characterId]/play-grant/route");
      const response = await invokeRoute(
        PUT,
        makeAuthedRequest({ userId: "player-1" }, "gm-1"),
        makeParams({ id: "g-1", characterId: "c-1" })
      );
      expect(response.status).toBe(404);
    });
  });

  describe("DELETE", () => {
    it("returns 401 when unauthenticated", async () => {
      const { DELETE } =
        await import("@/app/api/games/[id]/characters/[characterId]/play-grant/route");
      const response = await invokeRoute(
        DELETE,
        makeUnauthedRequest(),
        makeParams({ id: "g-1", characterId: "c-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when the caller is not the game master", async () => {
      prismaMock.game.findUnique.mockResolvedValue({
        id: "g-1",
        gameMaster: "gm-1",
      });
      const { DELETE } =
        await import("@/app/api/games/[id]/characters/[characterId]/play-grant/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "player-1"),
        makeParams({ id: "g-1", characterId: "c-1" })
      );
      expect(response.status).toBe(403);
      expect(prismaMock.gameCharacter.update).not.toHaveBeenCalled();
    });

    it("returns 403 when revoking a grant on a player character", async () => {
      prismaMock.game.findUnique.mockResolvedValue({
        id: "g-1",
        gameMaster: "gm-1",
      });
      prismaMock.gameCharacter.findFirst.mockResolvedValue({
        id: "gc-1",
        gameId: "g-1",
        characterId: "c-1",
        playGrantUserId: "player-2",
      });
      prismaMock.gameUser.findMany.mockResolvedValue([
        { userId: "gm-1" },
        { userId: "player-1" },
      ]);
      prismaMock.characterUser.findMany.mockResolvedValue([
        { userId: "player-1" },
      ]);
      const { DELETE } =
        await import("@/app/api/games/[id]/characters/[characterId]/play-grant/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1", characterId: "c-1" })
      );
      expect(response.status).toBe(403);
      expect(prismaMock.gameCharacter.update).not.toHaveBeenCalled();
    });

    it("revokes a play grant without unlinking the character", async () => {
      mockGmControlledNpc();
      prismaMock.gameCharacter.findFirst.mockResolvedValue({
        id: "gc-1",
        gameId: "g-1",
        characterId: "c-1",
        playGrantUserId: "player-1",
      });
      prismaMock.gameCharacter.update.mockResolvedValue({
        id: "gc-1",
        playGrantUserId: null,
      });

      const { DELETE } =
        await import("@/app/api/games/[id]/characters/[characterId]/play-grant/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1", characterId: "c-1" })
      );
      expect(response.status).toBe(200);
      expect(prismaMock.gameCharacter.update).toHaveBeenCalledWith({
        where: { id: "gc-1" },
        data: { playGrantUserId: null },
      });
      const body = await response.json();
      expect(body.playGrantUserId).toBeNull();
    });
  });
});
