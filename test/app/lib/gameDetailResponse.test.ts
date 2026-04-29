import { describe, expect, it } from "vitest";
import { shapeGameForResponse } from "@/app/lib/gameDetailResponse";

function makeGameWithCharacters() {
  return {
    id: "g-1",
    gameMaster: "gm-1",
    name: "Game",
    premise: null,
    imageKey: null,
    nextSession: null,
    lore: null,
    users: [
      {
        id: "gu-gm",
        gameId: "g-1",
        userId: "gm-1",
        user: { id: "gm-1", name: "GM" },
      },
      {
        id: "gu-p1",
        gameId: "g-1",
        userId: "player-1",
        user: { id: "player-1", name: "Player" },
      },
    ],
    characters: [
      {
        id: "gc-owned",
        gameId: "g-1",
        characterId: "char-owned",
        isPublic: false,
        character: {
          id: "char-owned",
          generalInformation: {
            name: "Owned",
            surname: "Hero",
            level: 3,
            avatarKey: null,
          },
          combatInformation: { initiativeMod: 2 },
          users: [{ userId: "player-1" }],
        },
      },
      {
        id: "gc-public",
        gameId: "g-1",
        characterId: "char-public",
        isPublic: true,
        character: {
          id: "char-public",
          generalInformation: {
            name: "Known",
            surname: "Npc",
            level: 1,
            avatarKey: null,
          },
          combatInformation: { initiativeMod: 0 },
          users: [{ userId: "gm-1" }],
        },
      },
      {
        id: "gc-private",
        gameId: "g-1",
        characterId: "char-private",
        isPublic: false,
        character: {
          id: "char-private",
          generalInformation: {
            name: "Hidden",
            surname: "Npc",
            level: 4,
            avatarKey: null,
          },
          combatInformation: { initiativeMod: 1 },
          users: [{ userId: "gm-1" }],
        },
      },
      {
        id: "gc-legacy",
        gameId: "g-1",
        characterId: "char-legacy",
        character: {
          id: "char-legacy",
          generalInformation: {
            name: "Legacy",
            surname: "Npc",
            level: 2,
            avatarKey: null,
          },
          combatInformation: { initiativeMod: 1 },
          users: [{ userId: "gm-1" }],
        },
      },
    ],
    customItems: [],
    initiativeOrder: [],
    discordIntegration: null,
  };
}

describe("shapeGameForResponse visibility filtering", () => {
  it("includes all linked characters for game master", () => {
    const shaped = shapeGameForResponse(
      makeGameWithCharacters() as any,
      "gm-1"
    );
    expect(shaped?.characters?.map((c) => c.character.id).sort()).toEqual([
      "char-legacy",
      "char-owned",
      "char-private",
      "char-public",
    ]);
  });

  it("filters out private non-owned NPCs for non-GM", () => {
    const shaped = shapeGameForResponse(
      makeGameWithCharacters() as any,
      "player-1"
    );
    expect(shaped?.characters?.map((c) => c.character.id).sort()).toEqual([
      "char-legacy",
      "char-owned",
      "char-public",
    ]);
  });
});
