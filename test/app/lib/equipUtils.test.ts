import { describe, expect, it } from "vitest";
import {
  getApiSlotCapacity,
  getWearReliefEquippedInstanceCount,
  isWithinSlotCapacity,
} from "@/app/lib/equipUtils";

describe("getApiSlotCapacity", () => {
  it("returns 3 for brain and 2 for other slots", () => {
    expect(getApiSlotCapacity("BRAIN")).toBe(3);
    expect(getApiSlotCapacity("HAND")).toBe(2);
    expect(getApiSlotCapacity("HEAD")).toBe(2);
  });
});

describe("isWithinSlotCapacity", () => {
  const brainItem = (id: string, equipSlots: string[]) => ({
    id,
    quantity: 1,
    equipSlots,
    item: { equipSlotTypes: ["BRAIN"], equipSlotCost: 1 },
  });

  it("allows three brain-equipped items", () => {
    const carried = [
      brainItem("a", ["BRAIN"]),
      brainItem("b", ["BRAIN"]),
      brainItem("c", ["BRAIN"]),
    ];
    expect(isWithinSlotCapacity(carried, "c", ["BRAIN"])).toBe(true);
  });

  it("rejects a fourth brain-equipped item", () => {
    const carried = [
      brainItem("a", ["BRAIN"]),
      brainItem("b", ["BRAIN"]),
      brainItem("c", ["BRAIN"]),
      brainItem("d", []),
    ];
    expect(isWithinSlotCapacity(carried, "d", ["BRAIN"])).toBe(false);
  });
});

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
