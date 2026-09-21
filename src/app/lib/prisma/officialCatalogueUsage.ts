import {
  emptyOfficialCatalogueUsage,
  type OfficialCatalogueUsageBreakdown,
  type OfficialCatalogueUsageDomain,
} from "@/app/lib/officialCatalogueUsage";
import { prisma } from "./client";

export async function getOfficialCatalogueUsage(
  domain: OfficialCatalogueUsageDomain,
  id: string
): Promise<OfficialCatalogueUsageBreakdown | null> {
  switch (domain) {
    case "items": {
      const item = await prisma.item.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!item) return null;
      const [characters, uniqueItems, favouriteWeaponRows] = await Promise.all([
        prisma.itemCharacter.count({
          where: { itemId: id, sourceType: "GLOBAL_ITEM" },
        }),
        prisma.uniqueItem.count({ where: { itemId: id } }),
        prisma.pathCharacter.count({
          where: { favouriteWeaponItemId: id },
        }),
      ]);
      return {
        ...emptyOfficialCatalogueUsage(),
        characters,
        uniqueItems,
        favouriteWeaponRows,
      };
    }
    case "vehicles": {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!vehicle) return null;
      const [characters, uniqueVehicles] = await Promise.all([
        prisma.vehicleCharacter.count({
          where: { vehicleId: id, sourceType: "GLOBAL_VEHICLE" },
        }),
        prisma.uniqueVehicle.count({ where: { vehicleId: id } }),
      ]);
      return {
        ...emptyOfficialCatalogueUsage(),
        characters,
        uniqueVehicles,
      };
    }
    case "enemies": {
      const enemy = await prisma.enemy.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!enemy) return null;
      const enemyInstances = await prisma.enemyInstance.count({
        where: { sourceOfficialEnemyId: id },
      });
      return {
        ...emptyOfficialCatalogueUsage(),
        enemyInstances,
      };
    }
    case "features": {
      const feature = await prisma.feature.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!feature) return null;
      const featureGrants = await prisma.featureCharacter.count({
        where: { featureId: id },
      });
      return {
        ...emptyOfficialCatalogueUsage(),
        featureGrants,
      };
    }
    case "maps": {
      const map = await prisma.map.findUnique({
        where: { id },
        select: { id: true, gameId: true },
      });
      if (!map || map.gameId) return null;
      return emptyOfficialCatalogueUsage();
    }
    case "reference": {
      const entry = await prisma.referenceEntry.findUnique({
        where: { id },
        select: { id: true, gameId: true },
      });
      if (!entry || entry.gameId) return null;
      return emptyOfficialCatalogueUsage();
    }
  }
}
