import { describe, expect, it } from "vitest";
import {
  CHARACTER_SECTION_IDS,
  CHARACTER_SECTION_LABELS,
  DEFAULT_CHARACTER_SECTION_ORDER,
  characterSectionOrderSchema,
  isCharacterSectionId,
  toApiCharacterSectionOrder,
  toDbCharacterSectionOrder,
} from "@/app/lib/constants/characterSections";

describe("characterSections registry", () => {
  it("defines a label for every known section id", () => {
    for (const id of CHARACTER_SECTION_IDS) {
      expect(CHARACTER_SECTION_LABELS[id]).toBeTruthy();
    }
  });

  it("uses the current default character page order", () => {
    expect(DEFAULT_CHARACTER_SECTION_ORDER).toEqual([
      "attributes",
      "skills",
      "combat",
      "general",
      "health",
      "paths",
      "features",
      "inventory",
      "wallet",
      "notes",
    ]);
  });

  it("includes every known id exactly once in the default order", () => {
    expect(new Set(DEFAULT_CHARACTER_SECTION_ORDER).size).toBe(
      CHARACTER_SECTION_IDS.length
    );
    expect([...DEFAULT_CHARACTER_SECTION_ORDER].sort()).toEqual(
      [...CHARACTER_SECTION_IDS].sort()
    );
  });

  it("validates known section ids", () => {
    expect(isCharacterSectionId("attributes")).toBe(true);
    expect(isCharacterSectionId("notes")).toBe(true);
    expect(isCharacterSectionId("unknown")).toBe(false);
  });

  it("accepts a unique saved section order", () => {
    const result = characterSectionOrderSchema.safeParse([
      "inventory",
      "attributes",
      "skills",
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects duplicate ids in saved order", () => {
    const result = characterSectionOrderSchema.safeParse([
      "attributes",
      "attributes",
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects unknown ids in saved order", () => {
    const result = characterSectionOrderSchema.safeParse(["attributes", "foo"]);
    expect(result.success).toBe(false);
  });

  it("accepts null or missing saved order", () => {
    expect(characterSectionOrderSchema.safeParse(null).success).toBe(true);
    expect(characterSectionOrderSchema.safeParse(undefined).success).toBe(true);
  });

  it("maps empty stored order to null for API consumers", () => {
    expect(toApiCharacterSectionOrder([])).toBeNull();
    expect(toApiCharacterSectionOrder(null)).toBeNull();
    expect(toApiCharacterSectionOrder(["inventory", "attributes"])).toEqual([
      "inventory",
      "attributes",
    ]);
  });

  it("maps null or empty API order to empty array for storage", () => {
    expect(toDbCharacterSectionOrder(null)).toEqual([]);
    expect(toDbCharacterSectionOrder([])).toEqual([]);
    expect(toDbCharacterSectionOrder(undefined)).toBeUndefined();
    expect(toDbCharacterSectionOrder(["skills", "combat"])).toEqual([
      "skills",
      "combat",
    ]);
  });
});
