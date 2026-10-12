import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../../helpers";

const prismaMock = vi.hoisted(() => ({
  game: { findUnique: vi.fn() },
  gameUser: { findMany: vi.fn() },
  gameCharacter: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  characterUser: { findMany: vi.fn() },
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: prismaMock,
}));

function mockGmControlledLink() {
  prismaMock.game.findUnique.mockResolvedValue({
    id: "g-1",
    gameMaster: "gm-1",
  });
  prismaMock.gameCharacter.findFirst.mockResolvedValue({
    id: "gc-1",
    gameId: "g-1",
    characterId: "c-1",
  });
  prismaMock.gameUser.findMany.mockResolvedValue([
    { userId: "gm-1" },
    { userId: "player-1" },
  ]);
  prismaMock.characterUser.findMany.mockResolvedValue([{ userId: "gm-1" }]);
  prismaMock.gameCharacter.findMany.mockResolvedValue([]);
}

describe("PATCH /api/games/[id]/characters/[characterId]/npc-group", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { PATCH } =
      await import("@/app/api/games/[id]/characters/[characterId]/npc-group/route");
    const response = await invokeRoute(
      PATCH,
      makeUnauthedRequest({ npcGroup: "Crimson Claws" }),
      makeParams({ id: "g-1", characterId: "c-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when the caller is not the game master", async () => {
    prismaMock.game.findUnique.mockResolvedValue({
      id: "g-1",
      gameMaster: "gm-1",
    });
    const { PATCH } =
      await import("@/app/api/games/[id]/characters/[characterId]/npc-group/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ npcGroup: "Crimson Claws" }, "player-1"),
      makeParams({ id: "g-1", characterId: "c-1" })
    );
    expect(response.status).toBe(403);
    expect(prismaMock.gameCharacter.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the game does not exist", async () => {
    prismaMock.game.findUnique.mockResolvedValue(null);
    const { PATCH } =
      await import("@/app/api/games/[id]/characters/[characterId]/npc-group/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ npcGroup: "Crimson Claws" }, "gm-1"),
      makeParams({ id: "g-1", characterId: "c-1" })
    );
    expect(response.status).toBe(404);
    expect(prismaMock.gameCharacter.update).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is invalid", async () => {
    const { PATCH } =
      await import("@/app/api/games/[id]/characters/[characterId]/npc-group/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ npcGroup: 1 }, "gm-1"),
      makeParams({ id: "g-1", characterId: "c-1" })
    );
    expect(response.status).toBe(400);
    expect(prismaMock.game.findUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when the character is not linked to the game", async () => {
    prismaMock.game.findUnique.mockResolvedValue({
      id: "g-1",
      gameMaster: "gm-1",
    });
    prismaMock.gameCharacter.findFirst.mockResolvedValue(null);
    const { PATCH } =
      await import("@/app/api/games/[id]/characters/[characterId]/npc-group/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ npcGroup: "Crimson Claws" }, "gm-1"),
      makeParams({ id: "g-1", characterId: "c-1" })
    );
    expect(response.status).toBe(404);
    expect(prismaMock.gameCharacter.update).not.toHaveBeenCalled();
  });

  it("returns 400 when the character is a player character", async () => {
    prismaMock.game.findUnique.mockResolvedValue({
      id: "g-1",
      gameMaster: "gm-1",
    });
    prismaMock.gameCharacter.findFirst.mockResolvedValue({
      id: "gc-1",
      gameId: "g-1",
      characterId: "c-1",
    });
    prismaMock.gameUser.findMany.mockResolvedValue([
      { userId: "gm-1" },
      { userId: "player-1" },
    ]);
    prismaMock.characterUser.findMany.mockResolvedValue([
      { userId: "player-1" },
    ]);
    const { PATCH } =
      await import("@/app/api/games/[id]/characters/[characterId]/npc-group/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ npcGroup: "Crimson Claws" }, "gm-1"),
      makeParams({ id: "g-1", characterId: "c-1" })
    );
    expect(response.status).toBe(400);
    expect(prismaMock.gameCharacter.update).not.toHaveBeenCalled();
  });

  it("sets one group name on a GM-controlled character", async () => {
    mockGmControlledLink();
    prismaMock.gameCharacter.update.mockResolvedValue({
      id: "gc-1",
      npcGroup: "Crimson Claws",
    });
    const { PATCH } =
      await import("@/app/api/games/[id]/characters/[characterId]/npc-group/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ npcGroup: "Crimson Claws" }, "gm-1"),
      makeParams({ id: "g-1", characterId: "c-1" })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ npcGroup: "Crimson Claws" });
    expect(prismaMock.gameCharacter.update).toHaveBeenCalledWith({
      where: { id: "gc-1" },
      data: { npcGroup: "Crimson Claws" },
    });
  });

  it("clears the group when the name is Ungrouped", async () => {
    mockGmControlledLink();
    prismaMock.gameCharacter.update.mockResolvedValue({
      id: "gc-1",
      npcGroup: null,
    });
    const { PATCH } =
      await import("@/app/api/games/[id]/characters/[characterId]/npc-group/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ npcGroup: "  Ungrouped " }, "gm-1"),
      makeParams({ id: "g-1", characterId: "c-1" })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ npcGroup: null });
    expect(prismaMock.gameCharacter.update).toHaveBeenCalledWith({
      where: { id: "gc-1" },
      data: { npcGroup: null },
    });
  });

  it("clears the group when the GM chooses Ungrouped", async () => {
    mockGmControlledLink();
    prismaMock.gameCharacter.update.mockResolvedValue({
      id: "gc-1",
      npcGroup: null,
    });
    const { PATCH } =
      await import("@/app/api/games/[id]/characters/[characterId]/npc-group/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ npcGroup: "   " }, "gm-1"),
      makeParams({ id: "g-1", characterId: "c-1" })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ npcGroup: null });
    expect(prismaMock.gameCharacter.update).toHaveBeenCalledWith({
      where: { id: "gc-1" },
      data: { npcGroup: null },
    });
  });

  it("saves a later spelling as the first spelling already used", async () => {
    mockGmControlledLink();
    prismaMock.gameCharacter.findFirst.mockResolvedValue({
      id: "gc-2",
      gameId: "g-1",
      characterId: "c-2",
    });
    prismaMock.gameCharacter.findMany.mockResolvedValue([
      { npcGroup: "Crimson Claws" },
    ]);
    prismaMock.gameCharacter.update.mockResolvedValue({
      id: "gc-2",
      npcGroup: "Crimson Claws",
    });
    const { PATCH } =
      await import("@/app/api/games/[id]/characters/[characterId]/npc-group/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ npcGroup: "  crimson   claws " }, "gm-1"),
      makeParams({ id: "g-1", characterId: "c-2" })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ npcGroup: "Crimson Claws" });
    expect(prismaMock.gameCharacter.update).toHaveBeenCalledWith({
      where: { id: "gc-2" },
      data: { npcGroup: "Crimson Claws" },
    });
  });

  it("stores any capitalisation of Archived as Archived", async () => {
    mockGmControlledLink();
    prismaMock.gameCharacter.findMany.mockResolvedValue([
      { npcGroup: "archived" },
    ]);
    prismaMock.gameCharacter.update.mockResolvedValue({
      id: "gc-1",
      npcGroup: "Archived",
    });
    const { PATCH } =
      await import("@/app/api/games/[id]/characters/[characterId]/npc-group/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ npcGroup: "  aRcHiVeD " }, "gm-1"),
      makeParams({ id: "g-1", characterId: "c-1" })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ npcGroup: "Archived" });
    expect(prismaMock.gameCharacter.update).toHaveBeenCalledWith({
      where: { id: "gc-1" },
      data: { npcGroup: "Archived" },
    });
  });
});
