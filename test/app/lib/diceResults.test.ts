import { describe, expect, it } from "vitest";
import { sortDiceResultsHighToLow } from "@/app/lib/diceResults";

describe("sortDiceResultsHighToLow", () => {
  it("orders faces from highest to lowest", () => {
    expect(sortDiceResultsHighToLow([3, 10, 1, 8])).toEqual([10, 8, 3, 1]);
  });

  it("does not mutate the input array", () => {
    const faces = [4, 9, 2];
    expect(sortDiceResultsHighToLow(faces)).toEqual([9, 4, 2]);
    expect(faces).toEqual([4, 9, 2]);
  });

  it("returns an empty array unchanged", () => {
    expect(sortDiceResultsHighToLow([])).toEqual([]);
  });
});
