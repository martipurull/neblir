import { describe, expect, it } from "vitest";
import { groupNpcList, type NpcListEntry } from "@/app/lib/npcList";

function entry(
  partial: Partial<NpcListEntry> & Pick<NpcListEntry, "id" | "name">
): NpcListEntry {
  return {
    hasPlayGrant: false,
    npcGroup: null,
    ...partial,
  };
}

describe("groupNpcList", () => {
  it("orders Ungrouped first, then named groups A–Z", () => {
    const sections = groupNpcList([
      entry({ id: "z", name: "Zed", npcGroup: "Zeta" }),
      entry({ id: "u", name: "Uma", npcGroup: null }),
      entry({ id: "a", name: "Ann", npcGroup: "alpha" }),
    ]);

    expect(sections.map((section) => section.heading)).toEqual([
      "Ungrouped",
      "alpha",
      "Zeta",
    ]);
  });

  it("omits empty sections", () => {
    const sections = groupNpcList([
      entry({ id: "a", name: "Ann", npcGroup: "alpha" }),
      entry({ id: "b", name: "Bea", npcGroup: "   " }),
    ]);

    expect(sections.map((section) => section.heading)).toEqual([
      "Ungrouped",
      "alpha",
    ]);
    expect(
      sections.map((section) => section.entries.map((row) => row.id))
    ).toEqual([["b"], ["a"]]);
  });

  it("omits Ungrouped when every character has a group", () => {
    const sections = groupNpcList([
      entry({ id: "a", name: "Ann", npcGroup: "alpha" }),
      entry({ id: "b", name: "Bea", npcGroup: "Beta" }),
    ]);

    expect(sections.map((section) => section.heading)).toEqual([
      "alpha",
      "Beta",
    ]);
  });

  it("treats a stored name of Ungrouped as the empty section", () => {
    const sections = groupNpcList([
      entry({ id: "named", name: "Ann", npcGroup: "  Ungrouped " }),
      entry({ id: "plain", name: "Bea", npcGroup: null }),
    ]);

    expect(sections.map((section) => section.heading)).toEqual(["Ungrouped"]);
    expect(sections[0]?.entries.map((row) => row.id)).toEqual([
      "named",
      "plain",
    ]);
  });

  it("puts play-grant characters first, then the others A–Z by name", () => {
    const sections = groupNpcList([
      entry({ id: "zed", name: "Zed", npcGroup: "alpha", hasPlayGrant: false }),
      entry({ id: "ann", name: "ann", npcGroup: "alpha", hasPlayGrant: false }),
      entry({ id: "bea", name: "Bea", npcGroup: "alpha", hasPlayGrant: true }),
      entry({ id: "cy", name: "cy", npcGroup: "alpha", hasPlayGrant: true }),
    ]);

    expect(sections).toHaveLength(1);
    expect(sections[0]?.entries.map((row) => row.id)).toEqual([
      "bea",
      "cy",
      "ann",
      "zed",
    ]);
  });

  it("groups names that differ only by case or spaces under the first spelling", () => {
    const sections = groupNpcList([
      entry({ id: "first", name: "Ann", npcGroup: "Crimson Claws" }),
      entry({ id: "second", name: "Bea", npcGroup: "  crimson   claws " }),
      entry({ id: "other", name: "Cy", npcGroup: "Vestyd" }),
    ]);

    expect(sections.map((section) => section.heading)).toEqual([
      "Crimson Claws",
      "Vestyd",
    ]);
    expect(sections[0]?.entries.map((row) => row.id)).toEqual([
      "first",
      "second",
    ]);
  });
});
