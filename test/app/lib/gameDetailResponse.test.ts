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
      {
        id: "gu-p2",
        gameId: "g-1",
        userId: "player-2",
        user: { id: "player-2", name: "Other" },
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
        id: "gc-other-private",
        gameId: "g-1",
        characterId: "char-other-private",
        isPublic: false,
        character: {
          id: "char-other-private",
          generalInformation: {
            name: "Secret",
            surname: "PC",
            level: 5,
            avatarKey: null,
          },
          combatInformation: { initiativeMod: 1 },
          users: [{ userId: "player-2" }],
        },
      },
      {
        id: "gc-other-public",
        gameId: "g-1",
        characterId: "char-other-public",
        isPublic: true,
        character: {
          id: "char-other-public",
          generalInformation: {
            name: "Open",
            surname: "PC",
            level: 2,
            avatarKey: null,
          },
          combatInformation: { initiativeMod: 0 },
          users: [{ userId: "player-2" }],
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
      "char-other-private",
      "char-other-public",
      "char-owned",
      "char-private",
      "char-public",
    ]);
  });

  it("filters out private non-owned characters for non-GM", () => {
    const shaped = shapeGameForResponse(
      makeGameWithCharacters() as any,
      "player-1"
    );
    expect(shaped?.characters?.map((c) => c.character.id).sort()).toEqual([
      "char-legacy",
      "char-other-public",
      "char-owned",
      "char-public",
    ]);
  });

  it("hides another player's private PC from a different player", () => {
    const shaped = shapeGameForResponse(
      makeGameWithCharacters() as any,
      "player-2"
    );
    expect(shaped?.characters?.map((c) => c.character.id).sort()).toEqual([
      "char-legacy",
      "char-other-private",
      "char-other-public",
      "char-public",
    ]);
  });

  it("filters private enemy instances for non-GM and masks initiative names", () => {
    const game = {
      ...makeGameWithCharacters(),
      enemyInstances: [
        {
          id: "ei-public",
          name: "Goblin",
          isPublic: true,
          maxHealth: 10,
          currentHealth: 10,
          speed: 1,
          initiativeModifier: 0,
          reactionsPerRound: 1,
          reactionsRemaining: 1,
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "ei-private",
          name: "Stalker",
          isPublic: false,
          maxHealth: 20,
          currentHealth: 20,
          speed: 2,
          initiativeModifier: 1,
          reactionsPerRound: 1,
          reactionsRemaining: 1,
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initiativeOrder: [
        {
          combatantType: "ENEMY",
          combatantId: "ei-private",
          combatantName: "Stalker",
          rolledValue: 7,
          initiativeModifier: 1,
          submittedAt: new Date(),
        },
      ],
    };

    const gmView = shapeGameForResponse(game as any, "gm-1");
    expect(gmView?.enemyInstances?.map((e) => e.id)).toEqual([
      "ei-public",
      "ei-private",
    ]);
    expect(gmView?.initiativeOrder?.[0]?.displayName).toBe("Stalker");

    const playerView = shapeGameForResponse(game as any, "player-1");
    expect(playerView?.enemyInstances?.map((e) => e.id)).toEqual(["ei-public"]);
    expect(playerView?.initiativeOrder?.[0]?.displayName).toBe("Enemy");
    expect(playerView?.initiativeOrder?.[0]?.combatantName).toBe("Enemy");
  });
});
