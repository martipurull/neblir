import {
  isGmControlledGameCharacter,
  isPlayerCharacterInGame,
} from "@/app/lib/gmUtils";
import type { GameDetail } from "@/app/lib/types/game";
import { describe, expect, it } from "vitest";

function gameCharacter(linkedUserIds: string[]) {
  return {
    id: "gc-1",
    isPublic: true,
    character: {
      id: "char-1",
      name: "Test",
      isOwnedByCurrentUser: false,
      linkedUserIds,
    },
  } as NonNullable<GameDetail["characters"]>[number];
}

function game(overrides: {
  gameMaster: string;
  userIds: string[];
}): GameDetail {
  return {
    id: "game-1",
    name: "Test Game",
    gameMaster: overrides.gameMaster,
    users: overrides.userIds.map((userId) => ({
      userId,
      role: userId === overrides.gameMaster ? "GAME_MASTER" : "PLAYER",
    })),
    characters: [],
    isGameMaster: false,
  } as GameDetail;
}

describe("game character classification", () => {
  const gmId = "gm-user";
  const playerId = "player-user";

  it("treats characters with only a non-GM player owner as player characters", () => {
    const g = game({ gameMaster: gmId, userIds: [gmId, playerId] });
    const gc = gameCharacter([playerId]);
    expect(isPlayerCharacterInGame(gc, g)).toBe(true);
    expect(isGmControlledGameCharacter(gc, g)).toBe(false);
  });

  it("treats characters with only the GM as an owner as known NPCs", () => {
    const g = game({ gameMaster: gmId, userIds: [gmId, playerId] });
    const gc = gameCharacter([gmId]);
    expect(isGmControlledGameCharacter(gc, g)).toBe(true);
    expect(isPlayerCharacterInGame(gc, g)).toBe(false);
  });

  it("treats characters with both GM and player owners as player characters", () => {
    const g = game({ gameMaster: gmId, userIds: [gmId, playerId] });
    const gc = gameCharacter([gmId, playerId]);
    expect(isPlayerCharacterInGame(gc, g)).toBe(true);
    expect(isGmControlledGameCharacter(gc, g)).toBe(false);
  });

  it("treats characters with no in-game owners as GM-controlled", () => {
    const g = game({ gameMaster: gmId, userIds: [gmId, playerId] });
    const gc = gameCharacter(["outsider-user"]);
    expect(isGmControlledGameCharacter(gc, g)).toBe(true);
    expect(isPlayerCharacterInGame(gc, g)).toBe(false);
  });
});
