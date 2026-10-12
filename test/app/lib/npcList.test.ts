import { describe, expect, it } from "vitest";
import {
  groupNpcList,
  npcRollPickerCandidates,
  type NpcListEntry,
} from "@/app/lib/npcList";

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

  it("pins Archived last, after Ungrouped and named groups", () => {
    const sections = groupNpcList([
      entry({ id: "archived", name: "Ada", npcGroup: "Archived" }),
      entry({ id: "zeta", name: "Zed", npcGroup: "Zeta" }),
      entry({ id: "ungrouped", name: "Uma", npcGroup: null }),
      entry({ id: "alpha", name: "Ann", npcGroup: "alpha" }),
    ]);

    expect(sections.map((section) => section.heading)).toEqual([
      "Ungrouped",
      "alpha",
      "Zeta",
      "Archived",
    ]);
    expect(
      sections.map((section) => section.entries.map((row) => row.id))
    ).toEqual([["ungrouped"], ["alpha"], ["zeta"], ["archived"]]);
  });

  it("omits Archived when it has no members", () => {
    const sections = groupNpcList([
      entry({ id: "a", name: "Ann", npcGroup: "alpha" }),
      entry({ id: "b", name: "Bea", npcGroup: null }),
    ]);

    expect(sections.map((section) => section.heading)).toEqual([
      "Ungrouped",
      "alpha",
    ]);
  });

  it("places any capitalisation of Archived in the Archived section", () => {
    const sections = groupNpcList([
      entry({ id: "lower", name: "Ann", npcGroup: "archived" }),
      entry({ id: "spaced", name: "Bea", npcGroup: "  ARCHIVED " }),
      entry({ id: "named", name: "Cy", npcGroup: "alpha" }),
    ]);

    expect(sections.map((section) => section.heading)).toEqual([
      "alpha",
      "Archived",
    ]);
    expect(sections[1]?.entries.map((row) => row.id)).toEqual([
      "lower",
      "spaced",
    ]);
  });

  it("shows a character with no group under Ungrouped, beside Archived", () => {
    const sections = groupNpcList([
      entry({ id: "back", name: "Bea", npcGroup: null }),
      entry({ id: "set-aside", name: "Ann", npcGroup: "Archived" }),
    ]);

    expect(sections.map((section) => section.heading)).toEqual([
      "Ungrouped",
      "Archived",
    ]);
    expect(sections[0]?.entries.map((row) => row.id)).toEqual(["back"]);
  });
});

describe("npcRollPickerCandidates", () => {
  it("is a flat list that omits characters in Archived", () => {
    const candidates = npcRollPickerCandidates([
      entry({ id: "first", name: "Ann", npcGroup: null }),
      entry({ id: "set-aside", name: "Bea", npcGroup: " archived " }),
      entry({ id: "second", name: "Cy", npcGroup: "alpha" }),
      entry({ id: "also", name: "Dee", npcGroup: "ARCHIVED" }),
    ]);

    expect(candidates.map((row) => row.id)).toEqual(["first", "second"]);
  });
});
