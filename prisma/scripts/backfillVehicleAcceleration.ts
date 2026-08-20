/**
 * Set acceleration = 1 on all Vehicle and CustomVehicle rows, and on UniqueVehicle
 * rows that have no accelerationOverride yet.
 *
 * Usage: npx tsx prisma/scripts/backfillVehicleAcceleration.ts [--dry-run]
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const [officialCount, customCount, uniqueCount] = await Promise.all([
    prisma.vehicle.count(),
    prisma.customVehicle.count(),
    prisma.uniqueVehicle.count({
      where: { accelerationOverride: null },
    }),
  ]);

  console.log(
    `Found ${officialCount} official, ${customCount} custom, ${uniqueCount} unique vehicles missing accelerationOverride.`
  );

  if (dryRun) {
    console.log("Dry run — no writes.");
    return;
  }

  const [officialUpdated, customUpdated, uniqueUpdated] = await Promise.all([
    prisma.vehicle.updateMany({ data: { acceleration: 1 } }),
    prisma.customVehicle.updateMany({ data: { acceleration: 1 } }),
    prisma.uniqueVehicle.updateMany({
      where: { accelerationOverride: null },
      data: { accelerationOverride: 1 },
    }),
  ]);

  console.log(
    `Updated official: ${officialUpdated.count}, custom: ${customUpdated.count}, unique override: ${uniqueUpdated.count}.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
