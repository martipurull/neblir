import { describe, expect, it } from "vitest";
import {
  crisisPoolIsSuccess,
  deathRollDicePoolSize,
  madnessRollDicePoolSize,
} from "@/app/lib/crisisRoll";

describe("deathRollDicePoolSize", () => {
  it("uses the higher of Resilience and Stamina, minus injuries, minimum 1", () => {
    expect(deathRollDicePoolSize(3, 5, 0)).toBe(5);
    expect(deathRollDicePoolSize(4, 2, 1)).toBe(3);
    expect(deathRollDicePoolSize(2, 2, 3)).toBe(1);
  });
});

describe("madnessRollDicePoolSize", () => {
  it("uses Mentality minus trauma, minimum 1", () => {
    expect(madnessRollDicePoolSize(4, 1)).toBe(3);
    expect(madnessRollDicePoolSize(2, 3)).toBe(1);
  });
});

describe("crisisPoolIsSuccess", () => {
  it("succeeds when any die is 8, 9, or 10", () => {
    expect(crisisPoolIsSuccess([1, 8, 3])).toBe(true);
    expect(crisisPoolIsSuccess([10])).toBe(true);
    expect(crisisPoolIsSuccess([7, 7, 2])).toBe(false);
    expect(crisisPoolIsSuccess([])).toBe(false);
  });
});
