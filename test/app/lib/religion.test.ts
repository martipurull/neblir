import { Religion } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { getReligionLabel, RELIGIONS } from "@/app/lib/religion";

describe("religion", () => {
  it("includes every Prisma Religion value with a non-empty label", () => {
    const prismaValues = Object.values(Religion) as Religion[];
    expect(RELIGIONS.map((r) => r.value).sort()).toEqual(prismaValues.sort());
    for (const value of prismaValues) {
      expect(getReligionLabel(value).length).toBeGreaterThan(0);
    }
  });

  it("formats known religions with expected labels", () => {
    expect(getReligionLabel("CHOSEN_FAITH")).toBe("Chosen Faith");
    expect(getReligionLabel("FORE_CAST")).toBe("Fore Cast");
    expect(getReligionLabel("PTSD")).toBe("PTSD");
    expect(getReligionLabel("OTHER")).toBe("Other");
  });
});
