import { describe, expect, it } from "vitest";
import {
  characterHealthStatusBadgeClass,
  characterHealthStatusLabel,
  gmCombatReactionsClassName,
} from "@/app/(pages)/home/games/[id]/gm/sections/gmCombatDisplay";
import { characterStatusMark } from "@/app/lib/characterStatusMark";

function classTokens(className: string): string[] {
  return className.split(/\s+/).filter((token) => token.length > 0);
}

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

  it("reads the status mark for Deceased and Deranged and keeps Alive's green outline", () => {
    for (const status of ["DECEASED", "DERANGED"] as const) {
      const mark = characterStatusMark(status);
      const tokens = classTokens(characterHealthStatusBadgeClass(status));
      expect(characterHealthStatusLabel(status)).toBe(mark.label);
      expect(tokens).toContain(mark.fillClassName);
      expect(tokens).toContain(mark.borderClassName);
      expect(tokens).toContain(mark.textClassName);
      expect(tokens).toContain("rounded-full");
    }

    const alive = classTokens(characterHealthStatusBadgeClass("ALIVE"));
    expect(characterHealthStatusLabel("ALIVE")).toBe(
      characterStatusMark("ALIVE").label
    );
    expect(alive).toContain("border-neblirSafe-600");
    expect(alive).toContain("text-neblirSafe-600");
    expect(alive).not.toContain("bg-paleBlue");
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
