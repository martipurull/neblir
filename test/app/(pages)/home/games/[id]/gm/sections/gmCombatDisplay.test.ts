import { describe, expect, it } from "vitest";
import {
  characterHealthStatusBadgeClass,
  characterHealthStatusLabel,
  gmCombatReactionsClassName,
} from "@/app/(pages)/home/games/[id]/gm/sections/gmCombatDisplay";

describe("characterHealthStatusLabel", () => {
  it("labels each health status", () => {
    expect(characterHealthStatusLabel("ALIVE")).toBe("Alive");
    expect(characterHealthStatusLabel("DECEASED")).toBe("Deceased");
    expect(characterHealthStatusLabel("DERANGED")).toBe("Deranged");
  });
});

describe("characterHealthStatusBadgeClass", () => {
  it("uses semantic colors for each status", () => {
    expect(characterHealthStatusBadgeClass("ALIVE")).toContain("neblirSafe");
    expect(characterHealthStatusBadgeClass("DERANGED")).toContain(
      "neblirWarning"
    );
    expect(characterHealthStatusBadgeClass("DECEASED")).toContain(
      "neblirDanger"
    );
  });
});

describe("gmCombatReactionsClassName", () => {
  it("uses neblirDanger when remaining is 0", () => {
    expect(gmCombatReactionsClassName(0)).toContain("neblirDanger");
  });

  it("uses muted black when remaining is positive", () => {
    expect(gmCombatReactionsClassName(1)).toContain("text-black/70");
    expect(gmCombatReactionsClassName(1)).not.toContain("neblirDanger");
  });
});
