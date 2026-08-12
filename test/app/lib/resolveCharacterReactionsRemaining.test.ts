import { describe, expect, it } from "vitest";
import { resolveCharacterReactionsRemaining } from "@/app/lib/types/character";

describe("resolveCharacterReactionsRemaining", () => {
  it("returns persisted remaining when set", () => {
    expect(
      resolveCharacterReactionsRemaining({
        reactionsPerRound: 3,
        reactionsRemaining: 1,
      })
    ).toBe(1);
  });

  it("falls back to reactionsPerRound when remaining is missing", () => {
    expect(
      resolveCharacterReactionsRemaining({
        reactionsPerRound: 2,
      })
    ).toBe(2);
  });

  it("falls back to reactionsPerRound when remaining is null", () => {
    expect(
      resolveCharacterReactionsRemaining({
        reactionsPerRound: 2,
        reactionsRemaining: null,
      })
    ).toBe(2);
  });
});
