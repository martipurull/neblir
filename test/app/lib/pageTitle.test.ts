import { describe, expect, it } from "vitest";
import {
  formatCharacterDisplayName,
  resolveEntityPageTitle,
} from "@/app/lib/pageTitle";

describe("formatCharacterDisplayName", () => {
  it("joins name and surname", () => {
    expect(formatCharacterDisplayName("Aria", "Vale")).toBe("Aria Vale");
  });

  it("omits a blank surname", () => {
    expect(formatCharacterDisplayName("Aria", "")).toBe("Aria");
    expect(formatCharacterDisplayName("Aria", "   ")).toBe("Aria");
    expect(formatCharacterDisplayName("Aria")).toBe("Aria");
  });

  it("trims parts", () => {
    expect(formatCharacterDisplayName("  Aria  ", "  Vale  ")).toBe(
      "Aria Vale"
    );
  });
});

describe("resolveEntityPageTitle", () => {
  it("uses a non-empty name", () => {
    expect(resolveEntityPageTitle("Midnight Run", "Game")).toBe("Midnight Run");
  });

  it("falls back when the name is missing or blank", () => {
    expect(resolveEntityPageTitle(null, "Game")).toBe("Game");
    expect(resolveEntityPageTitle("   ", "Game")).toBe("Game");
    expect(resolveEntityPageTitle(undefined, "Character")).toBe("Character");
  });
});
