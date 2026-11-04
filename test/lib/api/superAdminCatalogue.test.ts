import { afterEach, describe, expect, it, vi } from "vitest";
import { getCatalogueEnemies, getEnemy } from "@/lib/api/enemies";
import { getCatalogueReferenceEntry } from "@/lib/api/referenceEntries";
import { getCatalogueFeature, getCatalogueFeatures } from "@/lib/api/features";
import { getMap } from "@/lib/api/maps";
import { getCataloguePath, getCataloguePaths } from "@/lib/api/paths";
import { getCatalogueVehicle, getCatalogueVehicles } from "@/lib/api/vehicles";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const hopper = {
  id: "vehicle-1",
  accessType: "PLAYER",
  name: "Hopper",
  description: "A light skiff.",
  confCost: 400,
  maxHp: 20,
  travelSpeedKmh: 80,
  combatSpeedMetres: 12,
  manoeuvrability: 2,
  acceleration: 3,
  maxPassengers: 2,
  locomotionModes: ["LAND"],
  vehicleSizeCategory: "LIGHT",
};

describe("getCatalogueVehicles", () => {
  it("returns the parsed official vehicles", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([hopper])));

    await expect(getCatalogueVehicles()).resolves.toEqual([hopper]);
  });

  it("rejects a vehicle missing its name", async () => {
    const { name: _name, ...withoutName } = hopper;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse([withoutName]))
    );

    await expect(getCatalogueVehicles()).rejects.toThrow(/0\.name/);
  });
});

describe("getCatalogueVehicle", () => {
  it("returns the parsed official vehicle", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(hopper)));

    await expect(getCatalogueVehicle("vehicle-1")).resolves.toEqual(hopper);
  });

  it("rejects a vehicle missing its name", async () => {
    const { name: _name, ...withoutName } = hopper;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(withoutName))
    );

    await expect(getCatalogueVehicle("vehicle-1")).rejects.toThrow(/name/);
  });
});

const ghoul = {
  id: "enemy-1",
  name: "Ghoul",
  health: 12,
  speed: 6,
  initiativeModifier: 1,
  numberOfReactions: 2,
};

const parsedGhoul = {
  ...ghoul,
  defenceMelee: 0,
  defenceRange: 0,
  defenceGrid: 0,
  attackMelee: 0,
  attackRange: 0,
  attackThrow: 0,
  attackGrid: 0,
  immunities: [],
  resistances: [],
  vulnerabilities: [],
  actions: [],
  additionalActions: [],
};

describe("getCatalogueEnemies", () => {
  it("returns the parsed official enemies", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([ghoul])));

    await expect(getCatalogueEnemies()).resolves.toEqual([parsedGhoul]);
  });

  it("rejects an enemy missing its name", async () => {
    const { name: _name, ...withoutName } = ghoul;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse([withoutName]))
    );

    await expect(getCatalogueEnemies()).rejects.toThrow(/0\.name/);
  });
});

describe("getEnemy", () => {
  it("returns the parsed official enemy", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(ghoul)));

    await expect(getEnemy("enemy-1")).resolves.toEqual(parsedGhoul);
  });

  it("rejects an enemy missing its name", async () => {
    const { name: _name, ...withoutName } = ghoul;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(withoutName))
    );

    await expect(getEnemy("enemy-1")).rejects.toThrow(/name/);
  });
});

const neblirMap = {
  id: "map-1",
  name: "Neblir",
  imageKey: "maps-neblir.png",
};

describe("getMap", () => {
  it("returns the parsed official map", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(neblirMap)));

    await expect(getMap("map-1")).resolves.toEqual(neblirMap);
  });

  it("rejects a map missing its name", async () => {
    const { name: _name, ...withoutName } = neblirMap;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(withoutName))
    );

    await expect(getMap("map-1")).rejects.toThrow(/name/);
  });
});

const fieldMedic = {
  id: "feature-1",
  name: "Field medic",
  description: "Stabilize an ally.",
  minPathRank: 1,
  maxGrade: 3,
  applicablePaths: ["SCIENTIST_DOCTOR"],
};

describe("getCatalogueFeatures", () => {
  it("returns the parsed official features", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse([fieldMedic]))
    );

    await expect(getCatalogueFeatures()).resolves.toEqual([fieldMedic]);
  });

  it("rejects a feature missing its name", async () => {
    const { name: _name, ...withoutName } = fieldMedic;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse([withoutName]))
    );

    await expect(getCatalogueFeatures()).rejects.toThrow(/0\.name/);
  });
});

describe("getCatalogueFeature", () => {
  it("returns the parsed official feature", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(fieldMedic)));

    await expect(getCatalogueFeature("feature-1")).resolves.toEqual(fieldMedic);
  });

  it("rejects a feature missing its name", async () => {
    const { name: _name, ...withoutName } = fieldMedic;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(withoutName))
    );

    await expect(getCatalogueFeature("feature-1")).rejects.toThrow(/name/);
  });
});

const soldier = {
  id: "path-1",
  name: "SOLDIER",
  baseFeature: "Drill",
};

describe("getCataloguePaths", () => {
  it("returns the parsed official paths", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([soldier])));

    await expect(getCataloguePaths()).resolves.toEqual([soldier]);
  });

  it("rejects a path missing its base feature", async () => {
    const { baseFeature: _baseFeature, ...withoutBase } = soldier;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse([withoutBase]))
    );

    await expect(getCataloguePaths()).rejects.toThrow(/0\.baseFeature/);
  });
});

const combatEntry = {
  id: "ref-1",
  category: "MECHANICS",
  slug: "combat",
  title: "Combat",
  createdAt: "2024-01-02T00:00:00.000Z",
  updatedAt: "2024-01-03T00:00:00.000Z",
};

const parsedCombatEntry = {
  id: "ref-1",
  category: "MECHANICS",
  slug: "combat",
  title: "Combat",
  access: "PLAYER",
  tags: [],
  sortOrder: 0,
  createdAt: new Date("2024-01-02T00:00:00.000Z"),
  updatedAt: new Date("2024-01-03T00:00:00.000Z"),
  attachments: [],
};

describe("getCatalogueReferenceEntry", () => {
  it("returns the parsed official reference entry", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(combatEntry))
    );

    await expect(getCatalogueReferenceEntry("ref-1")).resolves.toEqual(
      parsedCombatEntry
    );
  });

  it("rejects an entry missing its title", async () => {
    const { title: _title, ...withoutTitle } = combatEntry;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(withoutTitle))
    );

    await expect(getCatalogueReferenceEntry("ref-1")).rejects.toThrow(/title/);
  });
});

describe("getCataloguePath", () => {
  it("returns the parsed official path", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(soldier)));

    await expect(getCataloguePath("path-1")).resolves.toEqual(soldier);
  });

  it("rejects a path missing its base feature", async () => {
    const { baseFeature: _baseFeature, ...withoutBase } = soldier;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(withoutBase))
    );

    await expect(getCataloguePath("path-1")).rejects.toThrow(/baseFeature/);
  });
});
