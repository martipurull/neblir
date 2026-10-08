import { describe, expect, it } from "vitest";
import { isD10Success, sortDiceResultsHighToLow } from "@/app/lib/diceResults";

describe("isD10Success", () => {
  it("counts 8, 9 and 10 as successes", () => {
    expect([8, 9, 10].map(isD10Success)).toEqual([true, true, true]);
  });

  it("counts 1 to 7 as failures", () => {
    expect([1, 2, 3, 4, 5, 6, 7].some(isD10Success)).toBe(false);
  });
});

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
