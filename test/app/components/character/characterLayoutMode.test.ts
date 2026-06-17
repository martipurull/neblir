import { describe, expect, it } from "vitest";
import { resolveCharacterLayoutMode } from "@/app/components/character/CharacterDetailView";

describe("resolveCharacterLayoutMode", () => {
  it("defaults to horizontal when preference is null", () => {
    expect(resolveCharacterLayoutMode(null)).toBe("horizontal");
  });

  it("defaults to horizontal when preference is undefined", () => {
    expect(resolveCharacterLayoutMode(undefined)).toBe("horizontal");
  });

  it("preserves vertical preference", () => {
    expect(resolveCharacterLayoutMode("vertical")).toBe("vertical");
  });

  it("preserves horizontal preference", () => {
    expect(resolveCharacterLayoutMode("horizontal")).toBe("horizontal");
  });
});
