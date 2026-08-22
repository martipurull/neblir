/**
 * Set vehicleMountable = false on all Item and CustomItem rows, and clear
 * vehicleMountableOverride on UniqueItem rows that still have a value (strict
 * default: nothing is mountable until explicitly flagged).
 *
 * Also audits VehicleMountedItem links and detaches any mounts whose resolved
 * item is not vehicleMountable (strict policy).
 *
 * Usage: npx tsx prisma/scripts/backfillVehicleMountable.ts [--dry-run]
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const [itemCount, customCount, uniqueOverrideCount, mountCount] =
    await Promise.all([
      prisma.item.count(),
      prisma.customItem.count(),
      prisma.uniqueItem.count({
        where: { vehicleMountableOverride: { not: null } },
      }),
      prisma.vehicleMountedItem.count(),
    ]);

  console.log(
    `Items: ${itemCount}, custom: ${customCount}, unique with mountable override: ${uniqueOverrideCount}, mounts: ${mountCount}.`
  );

  if (dryRun) {
    console.log("Dry run — no writes.");
    return;
  }

  const [itemsUpdated, customUpdated, uniqueUpdated] = await Promise.all([
    prisma.item.updateMany({ data: { vehicleMountable: false } }),
    prisma.customItem.updateMany({ data: { vehicleMountable: false } }),
    prisma.uniqueItem.updateMany({
      where: { vehicleMountableOverride: { not: null } },
      data: { vehicleMountableOverride: null },
    }),
  ]);

  console.log(
    `Updated items: ${itemsUpdated.count}, custom: ${customUpdated.count}, unique overrides cleared: ${uniqueUpdated.count}.`
  );

  if (mountCount > 0) {
    const deleted = await prisma.vehicleMountedItem.deleteMany({});
    console.log(
      `Strict policy: detached ${deleted.count} existing vehicle mounts (items default to non-mountable).`
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
