/**
 * Set itemLocation to vehicle-mounted:<vehicleCharacterId> for every inventory
 * row that has a VehicleMountedItem link but is still marked as carried (or
 * missing a location). Detach is unchanged; this only syncs location for
 * mounts created before location was set on attach.
 *
 * Usage: npx tsx prisma/scripts/backfillVehicleMountedItemLocation.ts [--dry-run]
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

const CARRIED = "carried";

function mountedLocation(vehicleCharacterId: string): string {
  return `vehicle-mounted:${vehicleCharacterId}`;
}

async function main() {
  const mounts = await prisma.vehicleMountedItem.findMany({
    select: {
      id: true,
      vehicleCharacterId: true,
      itemCharacterId: true,
    },
  });

  console.log(`Found ${mounts.length} vehicle mount link(s).`);

  let updated = 0;
  let skipped = 0;
  let missingItem = 0;

  for (const mount of mounts) {
    const item = await prisma.itemCharacter.findUnique({
      where: { id: mount.itemCharacterId },
      select: { id: true, itemLocation: true },
    });
    if (!item) {
      missingItem += 1;
      console.warn(
        `Mount ${mount.id}: itemCharacter ${mount.itemCharacterId} missing`
      );
      continue;
    }

    const expected = mountedLocation(mount.vehicleCharacterId);
    if (item.itemLocation === expected) {
      skipped += 1;
      continue;
    }

    if (
      item.itemLocation != null &&
      item.itemLocation !== CARRIED &&
      !item.itemLocation.startsWith("vehicle-mounted:")
    ) {
      console.warn(
        `Mount ${mount.id}: item ${item.id} has unexpected location "${item.itemLocation}"; updating to ${expected}`
      );
    }

    if (!dryRun) {
      await prisma.itemCharacter.update({
        where: { id: item.id },
        data: {
          itemLocation: expected,
          isEquipped: false,
          equipSlots: [],
        },
      });
    }
    updated += 1;
  }

  console.log(
    dryRun
      ? `Dry run — would update ${updated}, skip ${skipped}, missing items ${missingItem}.`
      : `Updated ${updated}, skipped ${skipped}, missing items ${missingItem}.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
