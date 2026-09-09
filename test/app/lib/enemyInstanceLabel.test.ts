import {
  composeEnemyInstanceLabel,
  withInstanceLabels,
} from "@/app/lib/enemyInstanceLabel";
import { describe, expect, it } from "vitest";

describe("composeEnemyInstanceLabel", () => {
  it("shows instance name and instance number when numbered and not renamed", () => {
    expect(
      composeEnemyInstanceLabel({
        name: "NS Gang Member",
        sourceName: "NS Gang Member",
        instanceNumber: 4,
        renamed: false,
      })
    ).toBe("NS Gang Member #4");
  });

  it("uses a spawn name override as the instance name, not a rename", () => {
    expect(
      composeEnemyInstanceLabel({
        name: "Thugs",
        sourceName: "NS Gang Member",
        instanceNumber: 4,
        renamed: false,
      })
    ).toBe("Thugs #4");
  });

  it("hides the instance number on an unsuffixed singleton", () => {
    expect(
      composeEnemyInstanceLabel({
        name: "Boss",
        sourceName: "Boss",
        instanceNumber: 1,
        renamed: false,
      })
    ).toBe("Boss");
  });

  it("shows #1 when spawned as part of a numbered batch", () => {
    expect(
      composeEnemyInstanceLabel({
        name: "NS Gang Member",
        sourceName: "NS Gang Member",
        instanceNumber: 1,
        renamed: false,
        numberVisible: true,
      })
    ).toBe("NS Gang Member #1");
  });

  it("does not rewrite an unsuffixed singleton when a later sibling exists", () => {
    expect(
      composeEnemyInstanceLabel({
        name: "Boss",
        sourceName: "Boss",
        instanceNumber: 1,
        renamed: false,
        numberVisible: false,
      })
    ).toBe("Boss");
  });

  it("puts the frozen source name in parentheses after a rename", () => {
    expect(
      composeEnemyInstanceLabel({
        name: "Scarface",
        sourceName: "NS Gang Member",
        instanceNumber: 1,
        renamed: true,
      })
    ).toBe("Scarface (NS Gang Member #1)");
  });

  it("does not use a spawn override as the source name after a rename", () => {
    expect(
      composeEnemyInstanceLabel({
        name: "Scarface",
        sourceName: "NS Gang Member",
        instanceNumber: 1,
        renamed: true,
      })
    ).not.toBe("Scarface (Thugs #1)");
    expect(
      composeEnemyInstanceLabel({
        name: "Scarface",
        sourceName: "NS Gang Member",
        instanceNumber: 1,
        renamed: true,
      })
    ).toBe("Scarface (NS Gang Member #1)");
  });

  it("shows #1 in parentheses when a former singleton is renamed", () => {
    expect(
      composeEnemyInstanceLabel({
        name: "Scarface",
        sourceName: "NS Gang Member",
        instanceNumber: 1,
        renamed: true,
      })
    ).toBe("Scarface (NS Gang Member #1)");
  });

  it("keeps parentheses after the instance name is changed back", () => {
    expect(
      composeEnemyInstanceLabel({
        name: "NS Gang Member",
        sourceName: "NS Gang Member",
        instanceNumber: 1,
        renamed: true,
      })
    ).toBe("NS Gang Member (NS Gang Member #1)");
  });

  it("does not follow a later custom enemy template rename", () => {
    expect(
      composeEnemyInstanceLabel({
        name: "Scarface",
        sourceName: "NS Gang Member",
        instanceNumber: 1,
        renamed: true,
      })
    ).toBe("Scarface (NS Gang Member #1)");
  });

  it("shows Enemy with no number or source name for a private instance to a player", () => {
    expect(
      composeEnemyInstanceLabel(
        {
          name: "Scarface",
          sourceName: "NS Gang Member",
          instanceNumber: 2,
          renamed: true,
          isPublic: false,
        },
        { viewerIsGameMaster: false }
      )
    ).toBe("Enemy");
  });

  it("shows the live instance label to the GM for a private instance", () => {
    expect(
      composeEnemyInstanceLabel(
        {
          name: "Scarface",
          sourceName: "NS Gang Member",
          instanceNumber: 1,
          renamed: true,
          isPublic: false,
        },
        { viewerIsGameMaster: true }
      )
    ).toBe("Scarface (NS Gang Member #1)");
  });

  it("shows the public instance label to a player", () => {
    expect(
      composeEnemyInstanceLabel(
        {
          name: "Thugs",
          sourceName: "NS Gang Member",
          instanceNumber: 4,
          renamed: false,
          isPublic: true,
        },
        { viewerIsGameMaster: false }
      )
    ).toBe("Thugs #4");
  });
});

describe("withInstanceLabels", () => {
  it("numbers a batch of the same source template together", () => {
    expect(
      withInstanceLabels([
        {
          name: "NS Gang Member",
          sourceName: "NS Gang Member",
          instanceNumber: 1,
          renamed: false,
          numberVisible: true,
        },
        {
          name: "NS Gang Member",
          sourceName: "NS Gang Member",
          instanceNumber: 2,
          renamed: false,
          numberVisible: true,
        },
      ]).map((row) => row.instanceLabel)
    ).toEqual(["NS Gang Member #1", "NS Gang Member #2"]);
  });

  it("keeps unsuffixed singletons unsuffixed", () => {
    expect(
      withInstanceLabels([
        {
          name: "Guard",
          sourceName: "Guard",
          instanceNumber: 1,
          renamed: false,
        },
        {
          name: "Guard",
          sourceName: "Guard",
          instanceNumber: 1,
          renamed: false,
        },
      ]).map((row) => row.instanceLabel)
    ).toEqual(["Guard", "Guard"]);
  });
});
