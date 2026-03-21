import { describe, expect, it } from "vitest";
import { uniqueItemCreateSchema } from "@/app/lib/types/item";

describe("uniqueItemCreateSchema", () => {
  it("accepts GLOBAL_ITEM with itemId", () => {
    const r = uniqueItemCreateSchema.safeParse({
      sourceType: "GLOBAL_ITEM",
      itemId: "507f1f77bcf86cd799439011",
    });
    expect(r.success).toBe(true);
  });

  it("accepts CUSTOM_ITEM with itemId", () => {
    const r = uniqueItemCreateSchema.safeParse({
      sourceType: "CUSTOM_ITEM",
      itemId: "507f1f77bcf86cd799439012",
    });
    expect(r.success).toBe(true);
  });

  it("rejects GLOBAL_ITEM without itemId", () => {
    const r = uniqueItemCreateSchema.safeParse({
      sourceType: "GLOBAL_ITEM",
    });
    expect(r.success).toBe(false);
  });

  it("accepts STANDALONE with name and non-negative weight", () => {
    const r = uniqueItemCreateSchema.safeParse({
      sourceType: "STANDALONE",
      nameOverride: "Mysterious bracelet",
      weightOverride: 0,
    });
    expect(r.success).toBe(true);
  });

  it("rejects STANDALONE with empty name", () => {
    const r = uniqueItemCreateSchema.safeParse({
      sourceType: "STANDALONE",
      nameOverride: "   ",
      weightOverride: 1,
    });
    expect(r.success).toBe(false);
  });

  it("rejects STANDALONE with negative weight", () => {
    const r = uniqueItemCreateSchema.safeParse({
      sourceType: "STANDALONE",
      nameOverride: "Thing",
      weightOverride: -1,
    });
    expect(r.success).toBe(false);
  });

  it("rejects STANDALONE without weightOverride", () => {
    const r = uniqueItemCreateSchema.safeParse({
      sourceType: "STANDALONE",
      nameOverride: "X",
    });
    expect(r.success).toBe(false);
  });
});
