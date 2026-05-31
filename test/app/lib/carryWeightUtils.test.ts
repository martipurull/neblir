import { describe, expect, it } from "vitest";
import {
  getCarriedWeight,
  getInventoryEntryCarriedWeight,
  getWornGearCarryWeightSavings,
  WORN_GEAR_CARRY_WEIGHT_FACTOR,
} from "@/app/lib/carryWeightUtils";

describe("getInventoryEntryCarriedWeight", () => {
  it("uses full weight when not worn on relief slots", () => {
    expect(
      getInventoryEntryCarriedWeight({
        quantity: 2,
        equipSlots: [],
        item: { weight: 4, equipSlotTypes: ["HEAD"] },
      })
    ).toBe(8);
  });

  it("halves weight for worn head gear only for equipped copies", () => {
    expect(
      getInventoryEntryCarriedWeight({
        quantity: 3,
        equipSlots: ["HEAD"],
        item: { weight: 2, equipSlotTypes: ["HEAD"] },
      })
    ).toBe(2 * WORN_GEAR_CARRY_WEIGHT_FACTOR + 2 * 2);
  });

  it("halves grade-3 body armour with one BODY equip tag", () => {
    expect(
      getInventoryEntryCarriedWeight({
        quantity: 1,
        equipSlots: ["BODY"],
        item: { weight: 10, equipSlotTypes: ["BODY"] },
      })
    ).toBe(10 * WORN_GEAR_CARRY_WEIGHT_FACTOR);
  });
});

describe("getCarriedWeight", () => {
  it("sums carried entries with worn-gear relief", () => {
    const total = getCarriedWeight([
      {
        itemLocation: "carried",
        quantity: 1,
        equipSlots: ["HEAD"],
        item: { weight: 4, equipSlotTypes: ["HEAD"] },
      },
      {
        itemLocation: "carried",
        quantity: 1,
        equipSlots: ["HAND"],
        item: { weight: 3, equipSlotTypes: ["HAND"] },
      },
      {
        itemLocation: "locker",
        quantity: 1,
        equipSlots: [],
        item: { weight: 100 },
      },
    ]);
    expect(total).toBe(4 * WORN_GEAR_CARRY_WEIGHT_FACTOR + 3);
  });
});

describe("getWornGearCarryWeightSavings", () => {
  it("reports savings from worn gear", () => {
    const inventory = [
      {
        itemLocation: "carried",
        quantity: 1,
        equipSlots: ["BODY"],
        item: { weight: 10, equipSlotTypes: ["BODY"] },
      },
    ];
    expect(getWornGearCarryWeightSavings(inventory)).toBe(5);
  });
});
