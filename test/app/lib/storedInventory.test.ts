import { describe, expect, it } from "vitest";
import {
  vehicleCargoItemLocation,
  vehicleMountedItemLocation,
} from "@/app/lib/constants/inventory";
import {
  projectStoredInventory,
  readStoredDrawerOpen,
  writeStoredDrawerOpen,
  type StoredDrawerOpenStorage,
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

function memoryStorage(): StoredDrawerOpenStorage {
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
    expect(layout.drawers.map((drawer) => drawer.heading)).toEqual([
      "Amber loft",
    ]);
  });

  it("puts spellings that differ by case, spacing, punctuation, or a possessive 's in one drawer", () => {
    const layout = projectStoredInventory([
      holding("map", "Map", "Indira's Flat"),
      holding("key", "Key", "  Indira flat "),
      holding("lamp", "Lamp", "Indira's flat"),
    ]);

    expect(layout.drawers).toEqual([
      expect.objectContaining({
        heading: "Indira flat",
        holdingCount: 3,
        open: true,
      }),
    ]);
    expect(layout.drawers[0]?.holdings.map((row) => row.id)).toEqual([
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
    expect(possessive.drawers[0]?.storageKey).toBe(
      spaced.drawers[0]?.storageKey
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
      layout.drawers.map((drawer) => ({
        heading: drawer.heading,
        holdingCount: drawer.holdingCount,
        ids: drawer.holdings.map((row) => row.id),
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
      closed.drawers.map((drawer) => ({
        heading: drawer.heading,
        open: drawer.open,
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

    expect(layout.drawers.map((drawer) => drawer.heading)).toEqual([
      "Gun",
      "Guns",
    ]);
    expect(layout.drawers.map((drawer) => drawer.holdingCount)).toEqual([1, 1]);
  });

  it("keeps a single holding as a drawer and sorts drawers and rows alphabetically", () => {
    const layout = projectStoredInventory([
      holding("zinc", "Zinc", "Zebra cache"),
      holding("amber", "amber", "Zebra cache"),
      holding("solo", "Solo", "Amber loft"),
    ]);

    expect(
      layout.drawers.map((drawer) => ({
        heading: drawer.heading,
        holdingCount: drawer.holdingCount,
        ids: drawer.holdings.map((row) => row.id),
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

    expect(layout.drawers).toHaveLength(1);
    expect(layout.drawers[0]?.heading).toBe("Locker");
    expect(layout.drawers[0]?.holdingCount).toBe(2);
    expect(layout.drawers[0]?.holdings.map((row) => row.id)).toEqual([
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
    const lockerKey = open.drawers.find(
      (drawer) => drawer.heading === "Locker"
    )?.storageKey;

    expect(
      open.drawers.map((drawer) => ({
        heading: drawer.heading,
        open: drawer.open,
      }))
    ).toEqual([
      { heading: "Attic", open: true },
      { heading: "Locker", open: true },
    ]);

    const closed = projectStoredInventory(holdings, {
      openByKey: { [lockerKey ?? ""]: false },
    });

    expect(
      closed.drawers.map((drawer) => ({
        heading: drawer.heading,
        open: drawer.open,
        holdingCount: drawer.holdingCount,
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
    const placeKey =
      projectStoredInventory([holding("map", "Map", "Locker")]).drawers[0]
        ?.storageKey ?? "";

    const atticKey =
      projectStoredInventory([holding("key", "Key", "Attic")]).drawers[0]
        ?.storageKey ?? "";

    writeStoredDrawerOpen(storage, "ada", placeKey, false);
    writeStoredDrawerOpen(storage, "ada", atticKey, false);

    expect(readStoredDrawerOpen(storage, "ada")).toEqual({
      [placeKey]: false,
      [atticKey]: false,
    });
    expect(readStoredDrawerOpen(storage, "bea")).toEqual({});
  });
});
