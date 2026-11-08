import { beforeEach, describe, expect, it, vi } from "vitest";

const currencyFindMany = vi.fn();
const botFindMany = vi.fn();

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    currency: {
      findMany: currencyFindMany,
    },
    bot: {
      findMany: botFindMany,
    },
  },
}));

describe("buildCatalogueSeedDataExport", () => {
  beforeEach(() => {
    currencyFindMany.mockReset();
    botFindMany.mockReset();
  });

  it("emits a currency's name, exchange value, and image key", async () => {
    currencyFindMany.mockResolvedValue([
      {
        id: "nord",
        name: "NORD",
        exchangeValue: 44,
        imageKey: "currencies-nord.png",
        protectedFromOfficialImport: true,
      },
    ]);

    const { buildCatalogueSeedDataExport } =
      await import("@/app/lib/catalogueSeedExport");
    const data = await buildCatalogueSeedDataExport(["currencies"]);

    expect(data.currencies).toEqual([
      {
        id: "nord",
        name: "NORD",
        exchangeValue: 44,
        imageKey: "currencies-nord.png",
      },
    ]);
  });

  it("emits an Official bot's authored fields, action list, combat values, and image key", async () => {
    botFindMany.mockResolvedValue([
      {
        id: "bot-scout",
        accessType: "PLAYER",
        name: "Scout Drone",
        imageKey: "bots-scout.png",
        description: "A small flyer.",
        confCost: 40,
        usage: "Recon",
        notes: "Quiet.",
        maxHp: 8,
        maxCargoWeightKg: 2,
        maxInstalledItems: 1,
        speed: 12,
        maxCarryWeight: 5,
        heightMetres: 0.4,
        weight: 3,
        processingPower: 1,
        processingPowerMaxPotential: 2,
        physicalPower: 0,
        physicalPowerMaxPotential: 0,
        finesseCapacity: 2,
        finesseCapacityMaxPotential: 1,
        gridProtection: -1,
        gridProtectionMaxPotential: 0,
        batteryCapacity: 4,
        batteryMaxPotential: 1,
        attackMelee: 1,
        attackRange: 3,
        defenceMelee: 1,
        defenceRange: 2,
        defenceGrid: 2,
        numberOfReactions: 1,
        actions: [
          {
            name: "Scan",
            description: null,
            notes: null,
            numberOfDice: 2,
            attribute: "processingPower",
            damage: null,
          },
        ],
        additionalActions: [],
        protectedFromOfficialImport: true,
      },
    ]);

    const { buildCatalogueSeedDataExport } =
      await import("@/app/lib/catalogueSeedExport");
    const data = await buildCatalogueSeedDataExport(["bots"]);

    expect(data.bots).toEqual([
      {
        id: "bot-scout",
        accessType: "PLAYER",
        name: "Scout Drone",
        imageKey: "bots-scout.png",
        description: "A small flyer.",
        confCost: 40,
        usage: "Recon",
        notes: "Quiet.",
        maxHp: 8,
        maxCargoWeightKg: 2,
        maxInstalledItems: 1,
        speed: 12,
        maxCarryWeight: 5,
        heightMetres: 0.4,
        weight: 3,
        processingPower: 1,
        processingPowerMaxPotential: 2,
        physicalPower: 0,
        physicalPowerMaxPotential: 0,
        finesseCapacity: 2,
        finesseCapacityMaxPotential: 1,
        gridProtection: -1,
        gridProtectionMaxPotential: 0,
        batteryCapacity: 4,
        batteryMaxPotential: 1,
        attackMelee: 1,
        attackRange: 3,
        defenceMelee: 1,
        defenceRange: 2,
        defenceGrid: 2,
        numberOfReactions: 1,
        actions: [
          {
            name: "Scan",
            description: null,
            notes: null,
            numberOfDice: 2,
            attribute: "processingPower",
            damage: null,
          },
        ],
        additionalActions: [],
      },
    ]);
    expect(data).not.toHaveProperty("customBots");
    expect(data).not.toHaveProperty("uniqueBots");
    expect(data).not.toHaveProperty("holdings");
  });
});
