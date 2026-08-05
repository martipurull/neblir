import { describe, expect, it } from "vitest";
import {
  characterHealthStatusBadgeClass,
  characterHealthStatusLabel,
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
