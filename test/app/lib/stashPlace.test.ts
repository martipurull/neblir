import { describe, expect, it } from "vitest";
import { stashPlaceNames, type StashPlaceHolding } from "@/app/lib/stashPlace";

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
