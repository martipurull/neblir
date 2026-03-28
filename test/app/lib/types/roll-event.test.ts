import { describe, expect, it } from "vitest";
import { rollEventPayloadSchema } from "@/app/lib/types/roll-event";

describe("rollEventPayloadSchema", () => {
  it("accepts a valid payload", () => {
    const parsed = rollEventPayloadSchema.safeParse({
      characterId: "char_1",
      rollType: "ATTACK",
      diceExpression: "3d10",
      results: [10, 8, 3],
      total: 21,
      metadata: { weaponName: "Knife" },
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects empty results", () => {
    const parsed = rollEventPayloadSchema.safeParse({
      rollType: "DEFENCE",
      results: [],
    });

    expect(parsed.success).toBe(false);
  });
});
