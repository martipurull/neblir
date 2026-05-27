import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GameCharacterLinkError,
  resolveGameCharacterLinkForCreate,
} from "@/app/lib/gameCharacterLink";

const { userIsInGameMock, findUniqueMock } = vi.hoisted(() => ({
  userIsInGameMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("@/app/lib/prisma/game", () => ({
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    game: {
      findUnique: findUniqueMock,
    },
  },
}));

describe("resolveGameCharacterLinkForCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws 403 when user is not in the game", async () => {
    userIsInGameMock.mockResolvedValue(false);
    await expect(
      resolveGameCharacterLinkForCreate("game-1", "user-1", false)
    ).rejects.toMatchObject({
      status: 403,
      message: "You are not part of this game",
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("throws 404 when game is missing", async () => {
    userIsInGameMock.mockResolvedValue(true);
    findUniqueMock.mockResolvedValue(null);
    await expect(
      resolveGameCharacterLinkForCreate("game-1", "user-1", true)
    ).rejects.toBeInstanceOf(GameCharacterLinkError);
    await expect(
      resolveGameCharacterLinkForCreate("game-1", "user-1", true)
    ).rejects.toMatchObject({ status: 404 });
  });

  it("defaults GM link to private when gameLinkIsPublic is omitted", async () => {
    userIsInGameMock.mockResolvedValue(true);
    findUniqueMock.mockResolvedValue({ gameMaster: "gm-1" });
    await expect(
      resolveGameCharacterLinkForCreate("game-1", "gm-1")
    ).resolves.toEqual({ gameId: "game-1", isPublic: false });
  });

  it("honours GM gameLinkIsPublic when true", async () => {
    userIsInGameMock.mockResolvedValue(true);
    findUniqueMock.mockResolvedValue({ gameMaster: "gm-1" });
    await expect(
      resolveGameCharacterLinkForCreate("game-1", "gm-1", true)
    ).resolves.toEqual({ gameId: "game-1", isPublic: true });
  });

  it("honours private visibility when a player opts out of public", async () => {
    userIsInGameMock.mockResolvedValue(true);
    findUniqueMock.mockResolvedValue({ gameMaster: "gm-1" });
    await expect(
      resolveGameCharacterLinkForCreate("game-1", "player-1", false)
    ).resolves.toEqual({ gameId: "game-1", isPublic: false });
  });

  it("defaults player links to public when visibility is omitted", async () => {
    userIsInGameMock.mockResolvedValue(true);
    findUniqueMock.mockResolvedValue({ gameMaster: "gm-1" });
    await expect(
      resolveGameCharacterLinkForCreate("game-1", "player-1")
    ).resolves.toEqual({ gameId: "game-1", isPublic: true });
  });
});
