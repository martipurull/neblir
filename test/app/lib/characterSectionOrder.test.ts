import { describe, expect, it } from "vitest";
import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterSectionOrder } from "@/app/lib/constants/characterSections";
import {
  applyCharacterSectionOrder,
  characterSectionOrdersEqual,
  isDefaultCharacterSectionOrder,
  reorderCharacterSectionIds,
  resolveCharacterSectionOrderList,
  toPersistedCharacterSectionOrder,
} from "@/app/lib/characterSectionOrder";

function slide(id: string): CharacterSectionSlide {
  return { id, title: id, children: null };
}

describe("applyCharacterSectionOrder", () => {
  const builtSections = [
    slide("attributes"),
    slide("skills"),
    slide("combat"),
    slide("inventory"),
  ];

  it("returns the input unchanged for zero or one section", () => {
    expect(applyCharacterSectionOrder([], null)).toEqual([]);
    expect(
      applyCharacterSectionOrder([slide("attributes")], ["inventory"])
    ).toEqual([slide("attributes")]);
  });

  it("uses default order when saved order is null or undefined", () => {
    expect(applyCharacterSectionOrder(builtSections, null)).toEqual([
      slide("attributes"),
      slide("skills"),
      slide("combat"),
      slide("inventory"),
    ]);
    expect(applyCharacterSectionOrder(builtSections, undefined)).toEqual([
      slide("attributes"),
      slide("skills"),
      slide("combat"),
      slide("inventory"),
    ]);
  });

  it("applies a full saved order for present sections", () => {
    expect(
      applyCharacterSectionOrder(builtSections, [
        "inventory",
        "combat",
        "skills",
        "attributes",
      ])
    ).toEqual([
      slide("inventory"),
      slide("combat"),
      slide("skills"),
      slide("attributes"),
    ]);
  });

  it("appends sections missing from saved order in default order", () => {
    expect(
      applyCharacterSectionOrder(builtSections, ["inventory", "attributes"])
    ).toEqual([
      slide("inventory"),
      slide("attributes"),
      slide("skills"),
      slide("combat"),
    ]);
  });

  it("skips saved ids for sections that are not currently present", () => {
    expect(
      applyCharacterSectionOrder(builtSections, [
        "wallet",
        "inventory",
        "notes",
        "attributes",
      ])
    ).toEqual([
      slide("inventory"),
      slide("attributes"),
      slide("skills"),
      slide("combat"),
    ]);
  });

  it("ignores unknown ids in saved order", () => {
    const savedOrder = [
      "inventory",
      "foo",
      "attributes",
    ] as CharacterSectionOrder;
    expect(applyCharacterSectionOrder(builtSections, savedOrder)).toEqual([
      slide("inventory"),
      slide("attributes"),
      slide("skills"),
      slide("combat"),
    ]);
  });

  it("preserves original section object references", () => {
    const sections = builtSections;
    const result = applyCharacterSectionOrder(sections, [
      "inventory",
      "attributes",
    ]);
    expect(result[0]).toBe(sections[3]);
    expect(result[1]).toBe(sections[0]);
  });

  it("appends unknown built section ids after default-ordered sections", () => {
    const sections = [...builtSections, slide("custom-panel")];
    expect(applyCharacterSectionOrder(sections, ["inventory"])).toEqual([
      slide("inventory"),
      slide("attributes"),
      slide("skills"),
      slide("combat"),
      slide("custom-panel"),
    ]);
  });
});

describe("resolveCharacterSectionOrderList", () => {
  it("returns default order when saved order is null", () => {
    expect(resolveCharacterSectionOrderList(null)).toEqual([
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

  it("applies saved order and appends missing ids in default order", () => {
    expect(
      resolveCharacterSectionOrderList(["inventory", "attributes"])
    ).toEqual([
      "inventory",
      "attributes",
      "skills",
      "combat",
      "general",
      "health",
      "paths",
      "features",
      "wallet",
      "notes",
    ]);
  });

  it("ignores unknown ids and duplicate entries in saved order", () => {
    const savedOrder = [
      "inventory",
      "foo",
      "inventory",
      "attributes",
    ] as CharacterSectionOrder;

    expect(resolveCharacterSectionOrderList(savedOrder)).toEqual([
      "inventory",
      "attributes",
      "skills",
      "combat",
      "general",
      "health",
      "paths",
      "features",
      "wallet",
      "notes",
    ]);
  });
});

describe("reorderCharacterSectionIds", () => {
  const order = ["attributes", "skills", "combat", "inventory"] as const;

  it("moves a section before its drop target", () => {
    expect(reorderCharacterSectionIds(order, "inventory", "skills")).toEqual([
      "attributes",
      "inventory",
      "skills",
      "combat",
    ]);
  });

  it("returns the same order when ids match", () => {
    expect(reorderCharacterSectionIds(order, "skills", "skills")).toEqual([
      ...order,
    ]);
  });
});

describe("isDefaultCharacterSectionOrder", () => {
  it("detects the canonical default order", () => {
    expect(
      isDefaultCharacterSectionOrder(resolveCharacterSectionOrderList(null))
    ).toBe(true);
    expect(isDefaultCharacterSectionOrder(["inventory", "attributes"])).toBe(
      false
    );
  });
});

describe("characterSectionOrdersEqual", () => {
  it("matches identical order arrays", () => {
    expect(
      characterSectionOrdersEqual(
        ["attributes", "skills"],
        ["attributes", "skills"]
      )
    ).toBe(true);
  });

  it("rejects different lengths or positions", () => {
    expect(
      characterSectionOrdersEqual(["attributes"], ["attributes", "skills"])
    ).toBe(false);
    expect(
      characterSectionOrdersEqual(
        ["skills", "attributes"],
        ["attributes", "skills"]
      )
    ).toBe(false);
  });
});

describe("toPersistedCharacterSectionOrder", () => {
  it("returns null when order matches the default", () => {
    expect(
      toPersistedCharacterSectionOrder(resolveCharacterSectionOrderList(null))
    ).toBeNull();
  });

  it("returns a copy when order is customized", () => {
    const custom = ["inventory", "attributes"] as const;
    expect(toPersistedCharacterSectionOrder(custom)).toEqual([
      "inventory",
      "attributes",
    ]);
    expect(toPersistedCharacterSectionOrder(custom)).not.toBe(custom);
  });
});
