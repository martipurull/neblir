import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeRoute, makeAuthedRequest, makeParams } from "../../../helpers";

const userIsInGameMock = vi.fn();
const updateGameMock = vi.fn();
const userIsGameMasterMock = vi.fn();

const prismaMock = {
  game: { findUnique: vi.fn() },
  gameCharacter: {
    findFirst: vi.fn(),
    deleteMany: vi.fn(),
  },
  botCharacter: {
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock("@/app/lib/prisma/game", () => ({
  userIsInGame: userIsInGameMock,
  updateGame: updateGameMock,
}));

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  userIsGameMaster: userIsGameMasterMock,
  userOwnsCharacter: vi.fn(),
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: prismaMock,
}));

describe("DELETE /api/games/[id]/characters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsInGameMock.mockResolvedValue(true);
    userIsGameMasterMock.mockResolvedValue(true);
    prismaMock.gameCharacter.findFirst.mockResolvedValue({ id: "gc-1" });
    prismaMock.gameCharacter.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.botCharacter.findMany.mockResolvedValue([{ id: "hold-1" }]);
    prismaMock.game.findUnique.mockResolvedValue({
      initiativeOrder: [
        {
          combatantType: "CHARACTER",
          combatantId: "c-1",
          combatantName: "Hero",
          rolledValue: 5,
          initiativeModifier: 1,
          submittedAt: new Date("2026-01-01T00:00:00Z"),
        },
        {
          combatantType: "BOT",
          combatantId: "hold-1",
          combatantName: "Mule",
          rolledValue: 8,
          initiativeModifier: -1,
          submittedAt: new Date("2026-01-01T00:00:01Z"),
        },
        {
          combatantType: "BOT",
          combatantId: "hold-other",
          combatantName: "Other",
          rolledValue: 3,
          initiativeModifier: 0,
          submittedAt: new Date("2026-01-01T00:00:02Z"),
        },
        {
          combatantType: "ENEMY",
          combatantId: "e-1",
          combatantName: "Stalker",
          rolledValue: 2,
          initiativeModifier: 0,
          submittedAt: new Date("2026-01-01T00:00:03Z"),
        },
      ],
    });
  });

  it("removes that game's bot initiative entry and leaves the holding", async () => {
    const { DELETE } = await import("@/app/api/games/[id]/characters/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest({ characterId: "c-1" }, "gm-1"),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      removed: true,
      characterId: "c-1",
    });
    expect(updateGameMock).toHaveBeenCalledWith("g-1", {
      initiativeOrder: [
        expect.objectContaining({
          combatantType: "BOT",
          combatantId: "hold-other",
        }),
        expect.objectContaining({
          combatantType: "ENEMY",
          combatantId: "e-1",
        }),
      ],
    });
    expect(prismaMock.botCharacter.delete).not.toHaveBeenCalled();
    expect(prismaMock.botCharacter.update).not.toHaveBeenCalled();
  });
});
