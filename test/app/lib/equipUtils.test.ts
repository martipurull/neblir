import { describe, expect, it } from "vitest";
import { getWearReliefEquippedInstanceCount } from "@/app/lib/equipUtils";

describe("getWearReliefEquippedInstanceCount", () => {
  it("returns 0 for hand-only equipment", () => {
    expect(getWearReliefEquippedInstanceCount(["HAND"], ["HAND"])).toBe(0);
  });

  it("returns 0 when unequipped", () => {
    expect(getWearReliefEquippedInstanceCount([], ["BODY"])).toBe(0);
  });

  it("counts one head-worn instance", () => {
    expect(getWearReliefEquippedInstanceCount(["HEAD"], ["HEAD"])).toBe(1);
  });

  it("counts grade-3 body armour with a single BODY tag", () => {
    expect(getWearReliefEquippedInstanceCount(["BODY"], ["BODY"])).toBe(1);
  });

  it("counts each body slot tag as a separate worn instance", () => {
    expect(getWearReliefEquippedInstanceCount(["BODY", "BODY"], ["BODY"])).toBe(
      2
    );
  });

  it("counts one body+head suit as one worn piece", () => {
    expect(
      getWearReliefEquippedInstanceCount(["BODY", "HEAD"], ["BODY", "HEAD"])
    ).toBe(1);
  });

  it("counts foot gear", () => {
    expect(getWearReliefEquippedInstanceCount(["FOOT"], ["FOOT"])).toBe(1);
  });

  it("counts flexible items worn on body", () => {
    expect(getWearReliefEquippedInstanceCount(["BODY"], [])).toBe(1);
  });
});
