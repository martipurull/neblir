import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const prismaMock = vi.hoisted(() => ({
  game: { findUnique: vi.fn() },
  gameCharacter: { findMany: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: prismaMock,
}));

describe("PATCH /api/games/[id]/npc-groups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { PATCH } = await import("@/app/api/games/[id]/npc-groups/route");
    const response = await invokeRoute(
      PATCH,
      makeUnauthedRequest({ from: "Crimson Claws", npcGroup: "Vestyd" }),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
    expect(prismaMock.gameCharacter.updateMany).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller is not the game master", async () => {
    prismaMock.game.findUnique.mockResolvedValue({
      id: "g-1",
      gameMaster: "gm-1",
    });
    const { PATCH } = await import("@/app/api/games/[id]/npc-groups/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { from: "Crimson Claws", npcGroup: "Vestyd" },
        "player-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
    expect(prismaMock.gameCharacter.updateMany).not.toHaveBeenCalled();
  });

  it("returns 404 when the game does not exist", async () => {
    prismaMock.game.findUnique.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/games/[id]/npc-groups/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ from: "Crimson Claws", npcGroup: "Vestyd" }, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(404);
    expect(prismaMock.gameCharacter.updateMany).not.toHaveBeenCalled();
  });

  it("returns 404 when that group is not on the game", async () => {
    prismaMock.game.findUnique.mockResolvedValue({
      id: "g-1",
      gameMaster: "gm-1",
    });
    prismaMock.gameCharacter.findMany.mockResolvedValue([
      { id: "gc-3", npcGroup: "Vestyd" },
    ]);
    const { PATCH } = await import("@/app/api/games/[id]/npc-groups/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ from: "Crimson Claws", npcGroup: "Vestyd" }, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(404);
    expect(prismaMock.gameCharacter.updateMany).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is invalid", async () => {
    const { PATCH } = await import("@/app/api/games/[id]/npc-groups/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ from: "Crimson Claws", npcGroup: 1 }, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    expect(prismaMock.game.findUnique).not.toHaveBeenCalled();
  });

  it("returns 400 when the heading is Ungrouped", async () => {
    prismaMock.game.findUnique.mockResolvedValue({
      id: "g-1",
      gameMaster: "gm-1",
    });
    prismaMock.gameCharacter.findMany.mockResolvedValue([]);
    const { PATCH } = await import("@/app/api/games/[id]/npc-groups/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ from: "  Ungrouped ", npcGroup: "Vestyd" }, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    expect(prismaMock.gameCharacter.updateMany).not.toHaveBeenCalled();
  });

  it("returns 400 when the new name is Ungrouped", async () => {
    prismaMock.game.findUnique.mockResolvedValue({
      id: "g-1",
      gameMaster: "gm-1",
    });
    prismaMock.gameCharacter.findMany.mockResolvedValue([
      { id: "gc-1", npcGroup: "Crimson Claws" },
    ]);
    const { PATCH } = await import("@/app/api/games/[id]/npc-groups/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ from: "Crimson Claws", npcGroup: "   " }, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    expect(prismaMock.gameCharacter.updateMany).not.toHaveBeenCalled();
  });

  it("renames every matching link to the new spelling in one change", async () => {
    prismaMock.game.findUnique.mockResolvedValue({
      id: "g-1",
      gameMaster: "gm-1",
    });
    prismaMock.gameCharacter.findMany.mockResolvedValue([
      { id: "gc-1", npcGroup: "crimson claws" },
      { id: "gc-2", npcGroup: "  crimson   claws " },
      { id: "gc-3", npcGroup: "Vestyd" },
    ]);
    prismaMock.gameCharacter.updateMany.mockResolvedValue({ count: 2 });
    const { PATCH } = await import("@/app/api/games/[id]/npc-groups/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { from: "Crimson Claws", npcGroup: "Crimson Claws" },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ npcGroup: "Crimson Claws" });
    expect(prismaMock.gameCharacter.updateMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.gameCharacter.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["gc-1", "gc-2"] } },
      data: { npcGroup: "Crimson Claws" },
    });
    expect(prismaMock.gameCharacter.update).not.toHaveBeenCalled();
  });

  it("joins an existing group and keeps the spelling already stored", async () => {
    prismaMock.game.findUnique.mockResolvedValue({
      id: "g-1",
      gameMaster: "gm-1",
    });
    prismaMock.gameCharacter.findMany.mockResolvedValue([
      { id: "gc-1", npcGroup: "Crimson Claws" },
      { id: "gc-2", npcGroup: "crimson claws" },
      { id: "gc-3", npcGroup: "Vestyd" },
    ]);
    prismaMock.gameCharacter.updateMany.mockResolvedValue({ count: 2 });
    const { PATCH } = await import("@/app/api/games/[id]/npc-groups/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { from: "Crimson Claws", npcGroup: "  vestyd " },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ npcGroup: "Vestyd" });
    expect(prismaMock.gameCharacter.updateMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.gameCharacter.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["gc-1", "gc-2"] } },
      data: { npcGroup: "Vestyd" },
    });
  });

  it("rejects renaming Archived, in any capitalisation", async () => {
    prismaMock.game.findUnique.mockResolvedValue({
      id: "g-1",
      gameMaster: "gm-1",
    });
    prismaMock.gameCharacter.findMany.mockResolvedValue([
      { id: "gc-1", npcGroup: "Archived" },
    ]);
    const { PATCH } = await import("@/app/api/games/[id]/npc-groups/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ from: "  archived ", npcGroup: "Vestyd" }, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    expect(prismaMock.gameCharacter.updateMany).not.toHaveBeenCalled();
  });

  it("rejects renaming another group to Archived", async () => {
    prismaMock.game.findUnique.mockResolvedValue({
      id: "g-1",
      gameMaster: "gm-1",
    });
    prismaMock.gameCharacter.findMany.mockResolvedValue([
      { id: "gc-1", npcGroup: "Crimson Claws" },
    ]);
    const { PATCH } = await import("@/app/api/games/[id]/npc-groups/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { from: "Crimson Claws", npcGroup: "  ARCHIVED " },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    expect(prismaMock.gameCharacter.updateMany).not.toHaveBeenCalled();
  });
});
