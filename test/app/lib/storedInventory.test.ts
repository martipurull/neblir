import { describe, expect, it } from "vitest";
import {
  botCargoItemLocation,
  botCarriedItemLocation,
  botInstalledItemLocation,
  vehicleCargoItemLocation,
  vehicleMountedItemLocation,
} from "@/app/lib/constants/inventory";
import {
  projectStoredInventory,
  readStashDrawerOpen,
  writeStashDrawerOpen,
  type StashDrawerOpenStorage,
  type StoredInventoryHolding,
} from "@/app/lib/storedInventory";

function holding(
  id: string,
  name: string,
  itemLocation: string | null,
  stashGameId?: string | null
): StoredInventoryHolding & { stashGameId?: string | null } {
  return { id, customName: name, itemLocation, stashGameId };
}

function memoryStorage(): StashDrawerOpenStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe("projectStoredInventory", () => {
  it("lists vehicle cargo and mounted items first, alphabetically, with their location labels", () => {
    const layout = projectStoredInventory(
      [
        holding("apple", "Apple", "Amber loft"),
        holding("rope", "Rope", vehicleCargoItemLocation("rover")),
        holding("snack", "Snack", "carried"),
        holding("bolt", "Bolt", vehicleMountedItemLocation("bike")),
      ],
      { vehicleNamesById: { rover: "Rover", bike: "Bike" } }
    );

    expect(
      layout.vehicleRows.map((row) => ({
        id: row.holding.id,
        locationLabel: row.locationLabel,
      }))
    ).toEqual([
      { id: "bolt", locationLabel: "Bike (mounted)" },
      { id: "rope", locationLabel: "Rover" },
    ]);
    expect(
      layout.stashDrawers.map((stashDrawer) => stashDrawer.heading)
    ).toEqual(["Amber loft"]);
  });

  it("lists items on a bot with the bot, and keeps them out of stash drawers", () => {
    const layout = projectStoredInventory(
      [
        holding("crate", "Crate", "Locker"),
        holding("blade", "Blade", botInstalledItemLocation("scout")),
        holding("pack", "Pack", botCargoItemLocation("scout")),
        holding("lamp", "Lamp", botCarriedItemLocation("hauler")),
      ],
      { botNamesById: { scout: "Scout", hauler: "Hauler" } }
    );

    expect(
      layout.botRows.map((row) => ({
        id: row.holding.id,
        locationLabel: row.locationLabel,
      }))
    ).toEqual([
      { id: "blade", locationLabel: "Scout (installed)" },
      { id: "lamp", locationLabel: "Hauler (carried)" },
      { id: "pack", locationLabel: "Scout cargo" },
    ]);
    expect(layout.vehicleRows).toEqual([]);
    expect(
      layout.stashDrawers.map((stashDrawer) => stashDrawer.heading)
    ).toEqual(["Locker"]);
  });

  it("puts spellings that differ by case, spacing, punctuation, or a possessive 's in one drawer", () => {
    const layout = projectStoredInventory([
      holding("map", "Map", "Indira's Flat"),
      holding("key", "Key", "  Indira flat "),
      holding("lamp", "Lamp", "Indira's flat"),
    ]);

    expect(layout.stashDrawers).toEqual([
      expect.objectContaining({
        heading: "Indira flat",
        holdingCount: 3,
        open: true,
      }),
    ]);
    expect(layout.stashDrawers[0]?.holdings.map((row) => row.id)).toEqual([
      "key",
      "lamp",
      "map",
    ]);
    expect(layout.vehicleRows).toEqual([]);

    const possessive = projectStoredInventory([
      holding("map", "Map", "Indira's Flat"),
    ]);
    const spaced = projectStoredInventory([
      holding("key", "Key", "indira flat"),
    ]);
    expect(possessive.stashDrawers[0]?.stashKey).toBe(
      spaced.stashDrawers[0]?.stashKey
    );
  });

  it("keeps a blank place and punctuation-only places in one drawer", () => {
    const holdings = [
      holding("bang", "Bang", "???"),
      holding("shout", "Shout", "!!!"),
      holding("spaced", "Spaced", "?? ?"),
      holding("blank", "Blank", "   "),
      holding("map", "Map", "Locker"),
    ];
    const layout = projectStoredInventory(holdings);

    expect(
      layout.stashDrawers.map((stashDrawer) => ({
        heading: stashDrawer.heading,
        holdingCount: stashDrawer.holdingCount,
        ids: stashDrawer.holdings.map((row) => row.id),
      }))
    ).toEqual([
      {
        heading: "",
        holdingCount: 4,
        ids: ["bang", "blank", "shout", "spaced"],
      },
      { heading: "Locker", holdingCount: 1, ids: ["map"] },
    ]);

    const closed = projectStoredInventory(holdings, {
      openByKey: { "": false },
    });
    expect(
      closed.stashDrawers.map((stashDrawer) => ({
        heading: stashDrawer.heading,
        open: stashDrawer.open,
      }))
    ).toEqual([
      { heading: "", open: false },
      { heading: "Locker", open: true },
    ]);
  });

  it("keeps Guns and Gun as two drawers", () => {
    const layout = projectStoredInventory([
      holding("rifle", "Rifle", "Guns"),
      holding("pistol", "Pistol", "Gun"),
    ]);

    expect(
      layout.stashDrawers.map((stashDrawer) => stashDrawer.heading)
    ).toEqual(["Gun", "Guns"]);
    expect(
      layout.stashDrawers.map((stashDrawer) => stashDrawer.holdingCount)
    ).toEqual([1, 1]);
  });

  it("keeps a single holding as a drawer and sorts drawers and rows alphabetically", () => {
    const layout = projectStoredInventory([
      holding("zinc", "Zinc", "Zebra cache"),
      holding("amber", "amber", "Zebra cache"),
      holding("solo", "Solo", "Amber loft"),
    ]);

    expect(
      layout.stashDrawers.map((stashDrawer) => ({
        heading: stashDrawer.heading,
        holdingCount: stashDrawer.holdingCount,
        ids: stashDrawer.holdings.map((row) => row.id),
      }))
    ).toEqual([
      { heading: "Amber loft", holdingCount: 1, ids: ["solo"] },
      { heading: "Zebra cache", holdingCount: 2, ids: ["amber", "zinc"] },
    ]);
  });

  it("groups the same spelling left in two games as one drawer", () => {
    const layout = projectStoredInventory([
      holding("map", "Map", "Locker", "game-1"),
      holding("key", "Key", "Locker", "game-2"),
    ]);

    expect(layout.stashDrawers).toHaveLength(1);
    expect(layout.stashDrawers[0]?.heading).toBe("Locker");
    expect(layout.stashDrawers[0]?.holdingCount).toBe(2);
    expect(layout.stashDrawers[0]?.holdings.map((row) => row.id)).toEqual([
      "key",
      "map",
    ]);
  });

  it("starts a drawer open and closes only the place that was toggled", () => {
    const holdings = [
      holding("map", "Map", "Locker"),
      holding("key", "Key", "Attic"),
    ];
    const open = projectStoredInventory(holdings);
    const lockerKey = open.stashDrawers.find(
      (stashDrawer) => stashDrawer.heading === "Locker"
    )?.stashKey;

    expect(
      open.stashDrawers.map((stashDrawer) => ({
        heading: stashDrawer.heading,
        open: stashDrawer.open,
      }))
    ).toEqual([
      { heading: "Attic", open: true },
      { heading: "Locker", open: true },
    ]);

    const closed = projectStoredInventory(holdings, {
      openByKey: { [lockerKey ?? ""]: false },
    });

    expect(
      closed.stashDrawers.map((stashDrawer) => ({
        heading: stashDrawer.heading,
        open: stashDrawer.open,
        holdingCount: stashDrawer.holdingCount,
      }))
    ).toEqual([
      { heading: "Attic", open: true, holdingCount: 1 },
      { heading: "Locker", open: false, holdingCount: 1 },
    ]);
  });
});

describe("stored drawer memory", () => {
  it("remembers a closed drawer for this character and not for another", () => {
    const storage = memoryStorage();
    const stashKey =
      projectStoredInventory([holding("map", "Map", "Locker")]).stashDrawers[0]
        ?.stashKey ?? "";

    const atticKey =
      projectStoredInventory([holding("key", "Key", "Attic")]).stashDrawers[0]
        ?.stashKey ?? "";

    writeStashDrawerOpen(storage, "ada", stashKey, false);
    writeStashDrawerOpen(storage, "ada", atticKey, false);

    expect(readStashDrawerOpen(storage, "ada")).toEqual({
      [stashKey]: false,
      [atticKey]: false,
    });
    expect(readStashDrawerOpen(storage, "bea")).toEqual({});
  });
});
