import { describe, expect, it } from "vitest";
import {
  formatEquipSlotRequirementLines,
  formatEquipSlotTypeLabel,
  formatEquippedSlotsSummary,
} from "@/app/lib/equipSlotDisplay";

describe("formatEquipSlotTypeLabel", () => {
  it("maps known slot types", () => {
    expect(formatEquipSlotTypeLabel("BODY")).toBe("Body");
    expect(formatEquipSlotTypeLabel("HAND")).toBe("Hand");
  });
});

describe("formatEquipSlotRequirementLines", () => {
  it("returns empty for non-equippable items", () => {
    expect(formatEquipSlotRequirementLines({ equippable: false })).toEqual([]);
  });

  it("describes flexible equippable items", () => {
    const lines = formatEquipSlotRequirementLines({ equippable: true });
    expect(lines[0]).toContain("any equip area");
    expect(lines[1]).toContain("1 slot");
  });

  it("describes grade-3 style body armour using two body slots", () => {
    const lines = formatEquipSlotRequirementLines({
      equippable: true,
      equipSlotTypes: ["BODY"],
      equipSlotCost: 2,
    });
    expect(lines.some((l) => l.includes("Body"))).toBe(true);
    expect(lines.some((l) => l.includes("2 of 2"))).toBe(true);
    expect(lines.some((l) => l.includes("fills"))).toBe(true);
  });

  it("describes body+head suits", () => {
    const lines = formatEquipSlotRequirementLines({
      equippable: true,
      equipSlotTypes: ["BODY", "HEAD"],
      equipSlotCost: 1,
    });
    expect(lines.some((l) => l.includes("Full suit"))).toBe(true);
    expect(lines.some((l) => l.includes("Body") && l.includes("Head"))).toBe(
      true
    );
  });
});

describe("formatEquippedSlotsSummary", () => {
  it("returns not equipped when empty", () => {
    expect(formatEquippedSlotsSummary([])).toBe("Not equipped");
  });

  it("groups duplicate slots", () => {
    expect(formatEquippedSlotsSummary(["HAND", "HAND"])).toBe("Hand ×2");
  });
});
