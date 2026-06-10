import { describe, expect, it } from "vitest";
import {
  emitIsPrivateFromRollPrivacy,
  enemyInstanceIdFromRollMetadata,
  getGmRollPrivacyForCharacter,
  getGmRollPrivacyForEnemyInstance,
  isPrivateGameCharacterLink,
  resolvePersistedRollIsPrivate,
  rollMetadataWithPrivateFlag,
} from "@/app/lib/roll-privacy";
import type { GameDetail } from "@/app/lib/types/game";

function makeGame(
  overrides: Partial<GameDetail> & { characters?: GameDetail["characters"] }
): GameDetail {
  return {
    id: "g-1",
    name: "Test game",
    gameMaster: "gm-1",
    isGameMaster: true,
    characters: [],
    users: [],
    ...overrides,
  } as GameDetail;
}

describe("roll-privacy", () => {
  describe("isPrivateGameCharacterLink", () => {
    it("treats explicit false as private", () => {
      expect(isPrivateGameCharacterLink(false)).toBe(true);
    });

    it("treats true and undefined as public", () => {
      expect(isPrivateGameCharacterLink(true)).toBe(false);
      expect(isPrivateGameCharacterLink(undefined)).toBe(false);
      expect(isPrivateGameCharacterLink(null)).toBe(false);
    });
  });

  describe("getGmRollPrivacyForCharacter", () => {
    it("disables privacy controls for non-GM viewers", () => {
      expect(
        getGmRollPrivacyForCharacter(makeGame({ isGameMaster: false }), "npc-1")
      ).toEqual({ allowPrivateRoll: false, defaultPrivateRoll: false });
    });

    it("defaults private roll for GM on private NPC links", () => {
      const game = makeGame({
        characters: [
          {
            id: "gc-1",
            gameId: "g-1",
            characterId: "npc-1",
            isPublic: false,
            character: {
              id: "npc-1",
              name: "Hidden",
              surname: "NPC",
              initiativeMod: 0,
              linkedUserIds: [],
            },
          },
        ],
      });

      expect(getGmRollPrivacyForCharacter(game, "npc-1")).toEqual({
        allowPrivateRoll: true,
        defaultPrivateRoll: true,
      });
    });

    it("defaults public roll for GM on public NPC links", () => {
      const game = makeGame({
        characters: [
          {
            id: "gc-1",
            gameId: "g-1",
            characterId: "npc-1",
            isPublic: true,
            character: {
              id: "npc-1",
              name: "Known",
              surname: "NPC",
              initiativeMod: 0,
              linkedUserIds: [],
            },
          },
        ],
      });

      expect(getGmRollPrivacyForCharacter(game, "npc-1")).toEqual({
        allowPrivateRoll: true,
        defaultPrivateRoll: false,
      });
    });
  });

  describe("emitIsPrivateFromRollPrivacy", () => {
    it("returns undefined when GM toggle is unavailable", () => {
      expect(
        emitIsPrivateFromRollPrivacy(
          { allowPrivateRoll: false, defaultPrivateRoll: false },
          true
        )
      ).toBeUndefined();
    });

    it("returns checkbox state when GM toggle is available", () => {
      const privacy = { allowPrivateRoll: true, defaultPrivateRoll: true };
      expect(emitIsPrivateFromRollPrivacy(privacy, true)).toBe(true);
      expect(emitIsPrivateFromRollPrivacy(privacy, false)).toBe(false);
    });
  });

  describe("getGmRollPrivacyForEnemyInstance", () => {
    it("defaults private roll for private instances", () => {
      expect(getGmRollPrivacyForEnemyInstance(false)).toEqual({
        allowPrivateRoll: true,
        defaultPrivateRoll: true,
      });
    });

    it("defaults public roll for public instances", () => {
      expect(getGmRollPrivacyForEnemyInstance(true)).toEqual({
        allowPrivateRoll: true,
        defaultPrivateRoll: false,
      });
    });
  });

  describe("enemyInstanceIdFromRollMetadata", () => {
    it("reads enemyInstanceId from metadata", () => {
      expect(
        enemyInstanceIdFromRollMetadata({
          source: "enemyInstance",
          enemyInstanceId: "ei-1",
        })
      ).toBe("ei-1");
    });
  });

  describe("resolvePersistedRollIsPrivate", () => {
    it("honours explicit GM opt-out on private NPCs", () => {
      expect(
        resolvePersistedRollIsPrivate({
          requestedIsPrivate: false,
          isGameMaster: true,
          characterIsPublic: false,
          enemyInstanceIsPublic: null,
        })
      ).toBe(false);
    });

    it("defaults private for GM rolls on private NPCs", () => {
      expect(
        resolvePersistedRollIsPrivate({
          requestedIsPrivate: undefined,
          isGameMaster: true,
          characterIsPublic: false,
          enemyInstanceIsPublic: null,
        })
      ).toBe(true);
    });

    it("defaults private for GM rolls on private enemy instances", () => {
      expect(
        resolvePersistedRollIsPrivate({
          requestedIsPrivate: undefined,
          isGameMaster: true,
          characterIsPublic: null,
          enemyInstanceIsPublic: false,
        })
      ).toBe(true);
    });

    it("does not default private for players", () => {
      expect(
        resolvePersistedRollIsPrivate({
          requestedIsPrivate: undefined,
          isGameMaster: false,
          characterIsPublic: false,
          enemyInstanceIsPublic: false,
        })
      ).toBe(false);
    });
  });

  describe("rollMetadataWithPrivateFlag", () => {
    it("merges isPrivate into metadata", () => {
      expect(rollMetadataWithPrivateFlag({ label1: "Agility" }, true)).toEqual({
        label1: "Agility",
        isPrivate: true,
      });
    });

    it("returns metadata unchanged when not private", () => {
      expect(rollMetadataWithPrivateFlag({ label1: "Agility" }, false)).toEqual(
        { label1: "Agility" }
      );
    });
  });
});
