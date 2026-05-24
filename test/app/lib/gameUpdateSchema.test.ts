import { describe, expect, it } from "vitest";
import { gameUpdateSchema } from "@/app/lib/types/game";

describe("gameUpdateSchema", () => {
  it("accepts null imageKey to clear the cover", () => {
    const result = gameUpdateSchema.safeParse({ imageKey: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imageKey).toBeNull();
    }
  });

  it("accepts null premise to clear the text", () => {
    const result = gameUpdateSchema.safeParse({ premise: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.premise).toBeNull();
    }
  });

  it("accepts a string imageKey", () => {
    const result = gameUpdateSchema.safeParse({
      imageKey: "games/cover-1.png",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imageKey).toBe("games/cover-1.png");
    }
  });
});
