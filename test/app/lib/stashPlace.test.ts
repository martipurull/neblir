import { describe, expect, it } from "vitest";
import {
  resolveStashRename,
  stashPlaceNames,
  type StashPlaceHolding,
  type StashRenameHolding,
} from "@/app/lib/stashPlace";

function holding(
  characterId: string,
  itemLocation: string,
  stashGameId: string | null
): StashPlaceHolding {
  return { characterId, itemLocation, stashGameId };
}

describe("stashPlaceNames", () => {
  it("offers another character's place in this game as the place name", () => {
    expect(
      stashPlaceNames(
        [holding("other", "Indira's Flat", "game-1")],
        "me",
        "game-1"
      )
    ).toEqual(["Indira's Flat"]);
  });

  it("omits a place recorded for a different game", () => {
    expect(
      stashPlaceNames(
        [holding("other", "Indira's Flat", "game-2")],
        "me",
        "game-1"
      )
    ).toEqual([]);
  });

  it("offers this character's unshared place and not another character's", () => {
    expect(
      stashPlaceNames(
        [holding("me", "Locker", null), holding("other", "Secret cache", null)],
        "me",
        "game-1"
      )
    ).toEqual(["Locker"]);
  });

  it("omits vehicle cargo and mounted items", () => {
    expect(
      stashPlaceNames(
        [
          holding("other", "vehicle:vc-1", "game-1"),
          holding("other", "vehicle-mounted:vc-1", "game-1"),
          holding("me", "vehicle:vc-2", null),
          holding("other", "Armoury", "game-1"),
        ],
        "me",
        "game-1"
      )
    ).toEqual(["Armoury"]);
  });

  it("keeps one spelling when several in the game already match, the one that sorts first", () => {
    expect(
      stashPlaceNames(
        [
          holding("other", "Indira's Flat", "game-1"),
          holding("other", "indira flat", "game-1"),
          holding("other", "Indira's flat", "game-1"),
        ],
        "me",
        "game-1"
      )
    ).toEqual(["indira flat"]);
  });

  it("shows the shared spelling once when this character also has that place unshared", () => {
    expect(
      stashPlaceNames(
        [
          holding("other", "Indira's Flat", "game-1"),
          holding("me", "indira flat", null),
        ],
        "me",
        "game-1"
      )
    ).toEqual(["Indira's Flat"]);
  });

  it("keeps Guns and Gun as different places", () => {
    expect(
      stashPlaceNames(
        [holding("other", "Guns", "game-1"), holding("other", "Gun", "game-1")],
        "me",
        "game-1"
      )
    ).toEqual(["Gun", "Guns"]);
  });

  it("drops a place once no item left in that game remains there", () => {
    const left = [holding("other", "Indira's Flat", "game-1")];
    expect(stashPlaceNames(left, "me", "game-1")).toEqual(["Indira's Flat"]);
    expect(stashPlaceNames([], "me", "game-1")).toEqual([]);
  });

  it("with no active game offers this character's unshared places only", () => {
    expect(
      stashPlaceNames(
        [
          holding("me", "Locker", null),
          holding("me", "Indira's Flat", "game-1"),
          holding("other", "Armoury", "game-1"),
          holding("me", "carried", null),
        ],
        "me",
        null
      )
    ).toEqual(["Locker"]);
  });
});

function renameHolding(
  id: string,
  itemLocation: string,
  stashGameId: string | null
): StashRenameHolding {
  return { id, itemLocation, stashGameId };
}

describe("resolveStashRename", () => {
  it("renames holdings recorded for the active game and leaves another game and an unshared place unchanged", () => {
    expect(
      resolveStashRename(
        [
          renameHolding("flat", "Indira's Flat", "game-1"),
          renameHolding("flat-folded", "indira flat", "game-1"),
          renameHolding("other-game", "Indira's Flat", "game-2"),
          renameHolding("unshared", "Indira's Flat", null),
          renameHolding("armoury", "Armoury", "game-1"),
        ],
        "game-1",
        "Indira's Flat",
        "Amber loft"
      )
    ).toEqual({
      ok: true,
      placeName: "Amber loft",
      holdingIds: ["flat", "flat-folded"],
    });
  });

  it("keeps the spelling already saved in this game when the new name matches that stash", () => {
    expect(
      resolveStashRename(
        [
          renameHolding("locker", "Locker", "game-1"),
          renameHolding("flat", "Indira's Flat", "game-1"),
          renameHolding("flat-case", "Indira's flat", "game-1"),
          renameHolding("other-game", "indira flat", "game-2"),
        ],
        "game-1",
        "Locker",
        "indira flat"
      )
    ).toEqual({
      ok: true,
      placeName: "Indira's Flat",
      holdingIds: ["locker"],
    });
  });

  it("stores the spelling typed when the new name is still this stash", () => {
    expect(
      resolveStashRename(
        [
          renameHolding("flat", "Indira's Flat", "game-1"),
          renameHolding("flat-folded", "indira flat", "game-1"),
        ],
        "game-1",
        "Indira's Flat",
        "Indira's flat"
      )
    ).toEqual({
      ok: true,
      placeName: "Indira's flat",
      holdingIds: ["flat", "flat-folded"],
    });
  });

  it("rejects an empty name", () => {
    expect(
      resolveStashRename(
        [renameHolding("locker", "Locker", "game-1")],
        "game-1",
        "Locker",
        "   "
      )
    ).toEqual({
      ok: false,
      reason: "invalid",
      message: "Enter a place name.",
    });
  });

  it("rejects a name that folds to carried", () => {
    expect(
      resolveStashRename(
        [renameHolding("locker", "Locker", "game-1")],
        "game-1",
        "Locker",
        "Carried"
      )
    ).toEqual({
      ok: false,
      reason: "invalid",
      message:
        "That word is reserved for items the character is carrying. Choose a place name.",
    });
  });

  it("rejects a vehicle cargo or mounted location", () => {
    const locker = [renameHolding("locker", "Locker", "game-1")];
    expect(
      resolveStashRename(locker, "game-1", "Locker", "vehicle:rover")
    ).toEqual({
      ok: false,
      reason: "invalid",
      message:
        "That name is reserved for items in or on a vehicle. Use the vehicle's cargo or mount controls, or choose a place name.",
    });
    expect(
      resolveStashRename(locker, "game-1", "Locker", "vehicle-mounted:bike")
    ).toEqual({
      ok: false,
      reason: "invalid",
      message:
        "That name is reserved for items in or on a vehicle. Use the vehicle's cargo or mount controls, or choose a place name.",
    });
  });

  it("does not find a from-spelling that is not a stash on that game", () => {
    expect(
      resolveStashRename(
        [
          renameHolding("other-game", "Locker", "game-2"),
          renameHolding("unshared", "Locker", null),
        ],
        "game-1",
        "Locker",
        "Amber loft"
      )
    ).toEqual({ ok: false, reason: "missing" });
  });
});
