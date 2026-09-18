import { describe, expect, it } from "vitest";
import {
  heldPlayGrantCharactersInGame,
  isGmControlledGameCharacter,
  isHeldPlayGrantInGame,
  isKnownNpcSheetLinkForViewer,
  isPublicKnownNpcInGame,
  sortGrantedNpcsFirst,
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

  it("keeps a granted NPC as GM-controlled", () => {
    const gc = {
      ...makeNpcLink(true),
      playGrant: { userId: "p-1", name: "Player" },
    };
    const game = makeGame({ characters: [gc] });
    expect(isGmControlledGameCharacter(gc, game)).toBe(true);
  });

  it("matches a held play grant by viewer id, not by grant presence", () => {
    const gc = {
      ...makeNpcLink(true),
      playGrant: { userId: "p-1", name: "Player" },
    };
    expect(isHeldPlayGrantInGame(gc, "p-1")).toBe(true);
    expect(isHeldPlayGrantInGame(gc, "p-2")).toBe(false);
    expect(isHeldPlayGrantInGame(gc, "gm-1")).toBe(false);
  });

  it("counts a private grant as held for Playing and excludes it from Known NPCs", () => {
    const gc = {
      ...makeNpcLink(false),
      playGrant: { userId: "p-1", name: "Player" },
    };
    const game = makeGame({ characters: [gc], isGameMaster: false });
    expect(isHeldPlayGrantInGame(gc, "p-1")).toBe(true);
    expect(isPublicKnownNpcInGame(gc, game)).toBe(false);
    expect(isKnownNpcSheetLinkForViewer(gc, game, "p-1")).toBe(false);
  });

  it("gives the public-grant holder a Known NPCs sheet link and other players none", () => {
    const gc = {
      ...makeNpcLink(true),
      playGrant: { userId: "p-1", name: "Player" },
    };
    const game = makeGame({ characters: [gc], isGameMaster: false });
    expect(isKnownNpcSheetLinkForViewer(gc, game, "p-1")).toBe(true);
    expect(isKnownNpcSheetLinkForViewer(gc, game, "p-2")).toBe(false);
    expect(isKnownNpcSheetLinkForViewer(gc, game, "gm-1")).toBe(false);
  });

  it("Playing list is the viewer's grants, including private, and ignores others", () => {
    const publicGranted = {
      ...makeNpcLink(true, "npc-pub"),
      playGrant: { userId: "p-1", name: "Player" },
    };
    const privateGranted = {
      ...makeNpcLink(false, "npc-priv"),
      playGrant: { userId: "p-1", name: "Player" },
    };
    const otherGranted = {
      ...makeNpcLink(true, "npc-other"),
      playGrant: { userId: "p-2", name: "Other" },
    };
    const unggranted = makeNpcLink(true, "npc-plain");
    const game = makeGame({
      characters: [publicGranted, privateGranted, otherGranted, unggranted],
    });
    expect(
      heldPlayGrantCharactersInGame(game, "p-1").map((gc) => gc.characterId)
    ).toEqual(["npc-pub", "npc-priv"]);
  });

  it("pins granted NPCs first within public and within private", () => {
    const publicPlain = makeNpcLink(true, "npc-public-plain");
    const publicGranted = {
      ...makeNpcLink(true, "npc-public-granted"),
      playGrant: { userId: "p-1", name: "Player" },
    };
    const privatePlain = makeNpcLink(false, "npc-private-plain");
    const privateGranted = {
      ...makeNpcLink(false, "npc-private-granted"),
      playGrant: { userId: "p-1", name: "Player" },
    };
    expect(
      sortGrantedNpcsFirst([publicPlain, publicGranted]).map(
        (r) => r.characterId
      )
    ).toEqual(["npc-public-granted", "npc-public-plain"]);
    expect(
      sortGrantedNpcsFirst([privatePlain, privateGranted]).map(
        (r) => r.characterId
      )
    ).toEqual(["npc-private-granted", "npc-private-plain"]);
  });
});
