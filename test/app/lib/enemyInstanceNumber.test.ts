import { allocateEnemyInstanceSpawns } from "@/app/lib/enemyInstanceNumber";
import { describe, expect, it } from "vitest";

describe("allocateEnemyInstanceSpawns", () => {
  it("assigns instance number 1 when spawning the first instance of a template", () => {
    expect(
      allocateEnemyInstanceSpawns({
        occupied: [],
        count: 1,
        sourceName: "NS Gang Member",
        instanceName: "NS Gang Member",
      })
    ).toEqual([
      {
        instanceNumber: 1,
        name: "NS Gang Member",
        sourceName: "NS Gang Member",
        renamed: false,
      },
    ]);
  });

  it("assigns instance numbers 1 through 3 when spawning a first batch of three", () => {
    expect(
      allocateEnemyInstanceSpawns({
        occupied: [],
        count: 3,
        sourceName: "NS Gang Member",
        instanceName: "NS Gang Member",
      }).map((row) => row.instanceNumber)
    ).toEqual([1, 2, 3]);
  });

  it("continues from the highest instance number still on the table", () => {
    expect(
      allocateEnemyInstanceSpawns({
        occupied: [
          { instanceNumber: 1, name: "NS Gang Member" },
          { instanceNumber: 2, name: "NS Gang Member" },
          { instanceNumber: 3, name: "NS Gang Member" },
        ],
        count: 3,
        sourceName: "NS Gang Member",
        instanceName: "NS Gang Member",
      }).map((row) => row.instanceNumber)
    ).toEqual([4, 5, 6]);
  });

  it("treats an unsuffixed singleton as instance number 1", () => {
    expect(
      allocateEnemyInstanceSpawns({
        occupied: [{ name: "Boss" }],
        count: 1,
        sourceName: "Boss",
        instanceName: "Boss",
      }).map((row) => row.instanceNumber)
    ).toEqual([2]);
  });

  it("does not fill a hole while a higher instance number remains", () => {
    expect(
      allocateEnemyInstanceSpawns({
        occupied: [
          { instanceNumber: 1, name: "NS Gang Member" },
          { instanceNumber: 3, name: "NS Gang Member" },
        ],
        count: 1,
        sourceName: "NS Gang Member",
        instanceName: "NS Gang Member",
      }).map((row) => row.instanceNumber)
    ).toEqual([4]);
  });

  it("uses max still on the table after a higher number is deleted", () => {
    expect(
      allocateEnemyInstanceSpawns({
        occupied: [{ instanceNumber: 1, name: "NS Gang Member" }],
        count: 1,
        sourceName: "NS Gang Member",
        instanceName: "NS Gang Member",
      }).map((row) => row.instanceNumber)
    ).toEqual([2]);
  });

  it("sets instance name from a spawn override and is not a rename", () => {
    expect(
      allocateEnemyInstanceSpawns({
        occupied: [],
        count: 1,
        sourceName: "NS Gang Member",
        instanceName: "Thugs",
      })
    ).toEqual([
      {
        instanceNumber: 1,
        name: "Thugs",
        sourceName: "NS Gang Member",
        renamed: false,
      },
    ]);
  });

  it("recovers occupied numbers from a trailing #N in a legacy name", () => {
    expect(
      allocateEnemyInstanceSpawns({
        occupied: [{ name: "Goblin #1" }, { name: "Goblin #3" }],
        count: 1,
        sourceName: "Goblin",
        instanceName: "Goblin",
      }).map((row) => row.instanceNumber)
    ).toEqual([4]);
  });
});
