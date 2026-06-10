import { describe, expect, it } from "vitest";
import {
  isGmControlledGameCharacter,
  isPublicKnownNpcInGame,
} from "@/app/lib/gmUtils";
import type { GameDetail } from "@/app/lib/types/game";

function makeGame(
  overrides: Partial<GameDetail> & {
    characters?: NonNullable<GameDetail["characters"]>;
  }
): GameDetail {
  return {
    id: "g-1",
    name: "Test",
    gameMaster: "gm-1",
    isGameMaster: false,
    users: [
      { userId: "gm-1", user: { id: "gm-1", name: "GM" } },
      { userId: "p-1", user: { id: "p-1", name: "Player" } },
    ],
    characters: [],
    ...overrides,
  } as GameDetail;
}

function makeNpcLink(isPublic: boolean | undefined, characterId = "npc-1") {
  return {
    id: "gc-1",
    gameId: "g-1",
    characterId,
    isPublic,
    character: {
      id: characterId,
      name: "Test",
      surname: "NPC",
      linkedUserIds: ["gm-1"],
      isOwnedByCurrentUser: false,
      initiativeMod: 0,
    },
  } as NonNullable<GameDetail["characters"]>[number];
}

describe("gmUtils known NPC visibility", () => {
  it("treats GM-controlled public links as known NPCs", () => {
    const game = makeGame({ characters: [makeNpcLink(true)] });
    const gc = game.characters![0];
    expect(isGmControlledGameCharacter(gc, game)).toBe(true);
    expect(isPublicKnownNpcInGame(gc, game)).toBe(true);
  });

  it("excludes private GM-controlled NPCs from known NPCs", () => {
    const game = makeGame({ characters: [makeNpcLink(false)] });
    const gc = game.characters![0];
    expect(isGmControlledGameCharacter(gc, game)).toBe(true);
    expect(isPublicKnownNpcInGame(gc, game)).toBe(false);
  });

  it("treats undefined isPublic as public", () => {
    const game = makeGame({ characters: [makeNpcLink(undefined)] });
    expect(isPublicKnownNpcInGame(game.characters![0], game)).toBe(true);
  });
});
