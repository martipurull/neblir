import { Race } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { getRaceLabel, RACES } from "@/app/lib/race";

describe("race", () => {
  it("includes every Prisma Race value with a non-empty label", () => {
    const prismaValues = Object.values(Race) as Race[];
    expect(RACES.map((r) => r.value).sort()).toEqual(prismaValues.sort());
    for (const value of prismaValues) {
      expect(getRaceLabel(value).length).toBeGreaterThan(0);
    }
  });

  it("formats known races with expected labels", () => {
    expect(getRaceLabel("KINIAN")).toBe("Kinian");
    expect(getRaceLabel("HUMAN")).toBe("Human");
    expect(getRaceLabel("FENNE")).toBe("Fenne");
    expect(getRaceLabel("MANFENN")).toBe("Manfenn");
  });
});
