/**
 * Upsert global Vehicle documents from JSON.
 *
 * Usage: npx tsx prisma/scripts/upsertVehiclesFromFile.ts <path-to-vehicles.json> [--dry-run] [--force-official-import]
 *
 * JSON root may be an array or an object with a `vehicles` array.
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { vehicleSchema } from "../../src/app/lib/types/vehicle";
import { parseOfficialImportArgv } from "./officialImportCli";

const prisma = new PrismaClient();

const vehicleRowWithOptionalIdSchema = vehicleSchema
  .extend({
    id: z.string().optional(),
    acceleration: z.number().int().optional(),
  })
  .transform((row) => ({
    ...row,
    acceleration: row.acceleration ?? 1,
  }));

type VehicleRow = z.infer<typeof vehicleRowWithOptionalIdSchema>;

type ExistingVehicleRow = {
  id: string;
  name: string;
  protectedFromOfficialImport: boolean;
};

function normalizeVehicleNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function deepNullsToUndefined(value: unknown): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value))
    return value.map((item) => deepNullsToUndefined(item));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      const normalized = deepNullsToUndefined(v);
      if (normalized !== undefined) out[key] = normalized;
    }
    return out;
  }
  return value;
}

function vehicleImportWouldOverwriteProtectedRow(
  existing: { protectedFromOfficialImport: boolean } | null,
  forceOfficialImport: boolean
): boolean {
  return Boolean(existing?.protectedFromOfficialImport && !forceOfficialImport);
}

async function findExistingVehicleByName(
  name: string
): Promise<ExistingVehicleRow | null> {
  const nameKey = normalizeVehicleNameKey(name);
  const candidates = await prisma.vehicle.findMany({
    where: { name: name.trim() },
    select: {
      id: true,
      name: true,
      protectedFromOfficialImport: true,
    },
  });
  return (
    candidates.find(
      (candidate) => normalizeVehicleNameKey(candidate.name) === nameKey
    ) ?? null
  );
}

async function resolveExistingVehicleForUpsert(
  idFromRow: string | undefined,
  vehicleName: string
): Promise<ExistingVehicleRow | null> {
  if (idFromRow?.trim()) {
    const byId = await prisma.vehicle.findUnique({
      where: { id: idFromRow.trim() },
      select: {
        id: true,
        name: true,
        protectedFromOfficialImport: true,
      },
    });
    if (byId) return byId;
  }
  return findExistingVehicleByName(vehicleName);
}

function parseJsonRows(raw: string): VehicleRow[] {
  const parsed = JSON.parse(raw) as unknown;
  const entries = Array.isArray(parsed)
    ? parsed
    : parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as { vehicles?: unknown[] }).vehicles)
      ? (parsed as { vehicles: unknown[] }).vehicles
      : null;
  if (!entries) {
    throw new Error(
      'JSON root must be an array or object with "vehicles" array.'
    );
  }

  return entries.map((entry, index) => {
    const parsedRow = vehicleRowWithOptionalIdSchema.safeParse(
      deepNullsToUndefined(entry)
    );
    if (!parsedRow.success) {
      throw new Error(
        `JSON vehicle ${index + 1}: ${parsedRow.error.issues
          .map((issue) => issue.message)
          .join("; ")}`
      );
    }
    return parsedRow.data;
  });
}

async function main() {
  const { dryRun, forceOfficialImport, positional } = parseOfficialImportArgv(
    process.argv.slice(2)
  );
  const inputPath = positional[0];
  if (!inputPath) {
    console.error(
      "Usage: npx tsx prisma/scripts/upsertVehiclesFromFile.ts <path-to-vehicles.json> [--dry-run] [--force-official-import]"
    );
    process.exit(1);
  }

  const resolvedPath = path.resolve(inputPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  if (ext !== ".json") {
    console.error("Vehicle import currently supports JSON files only.");
    process.exit(1);
  }

  const rows = parseJsonRows(fs.readFileSync(resolvedPath, "utf8"));
  if (dryRun) {
    console.log(`[dry-run] JSON vehicles parsed: ${rows.length}.`);
    return;
  }

  let created = 0;
  let updated = 0;
  let skippedProtected = 0;

  for (const row of rows) {
    const { id: idFromRow, ...vehicle } = row;
    const existing = await resolveExistingVehicleForUpsert(
      idFromRow,
      vehicle.name
    );
    if (existing) {
      if (
        vehicleImportWouldOverwriteProtectedRow(existing, forceOfficialImport)
      ) {
        console.warn(
          `[skip] Vehicle ${idFromRow?.trim() ? `id "${idFromRow.trim()}"` : `"${vehicle.name}"`} is protected from official import (use --force-official-import to overwrite).`
        );
        skippedProtected += 1;
        continue;
      }
      await prisma.vehicle.update({
        where: { id: existing.id },
        data: {
          accessType: vehicle.accessType,
          name: vehicle.name,
          brand: vehicle.brand ?? null,
          year: vehicle.year ?? null,
          imageKey: vehicle.imageKey ?? null,
          confCost: vehicle.confCost,
          costInfo: vehicle.costInfo ?? null,
          description: vehicle.description,
          notes: vehicle.notes ?? null,
          maxHp: vehicle.maxHp,
          travelSpeedKmh: vehicle.travelSpeedKmh,
          combatSpeedMetres: vehicle.combatSpeedMetres,
          manoeuvrability: vehicle.manoeuvrability,
          acceleration: vehicle.acceleration ?? 1,
          weight: vehicle.weight ?? null,
          heightMetres: vehicle.heightMetres ?? null,
          maxCargoWeightKg: vehicle.maxCargoWeightKg ?? null,
          maxMountedItems: vehicle.maxMountedItems ?? null,
          maxPassengers: vehicle.maxPassengers,
          locomotionModes: vehicle.locomotionModes,
          vehicleSizeCategory: vehicle.vehicleSizeCategory,
        },
      });
      updated += 1;
      continue;
    }

    await prisma.vehicle.create({
      data: {
        ...(idFromRow?.trim() ? { id: idFromRow.trim() } : {}),
        accessType: vehicle.accessType,
        name: vehicle.name,
        brand: vehicle.brand ?? null,
        year: vehicle.year ?? null,
        imageKey: vehicle.imageKey ?? null,
        confCost: vehicle.confCost,
        costInfo: vehicle.costInfo ?? null,
        description: vehicle.description,
        notes: vehicle.notes ?? null,
        maxHp: vehicle.maxHp,
        travelSpeedKmh: vehicle.travelSpeedKmh,
        combatSpeedMetres: vehicle.combatSpeedMetres,
        manoeuvrability: vehicle.manoeuvrability,
        acceleration: vehicle.acceleration ?? 1,
        weight: vehicle.weight ?? null,
        heightMetres: vehicle.heightMetres ?? null,
        maxCargoWeightKg: vehicle.maxCargoWeightKg ?? null,
        maxMountedItems: vehicle.maxMountedItems ?? null,
        maxPassengers: vehicle.maxPassengers,
        locomotionModes: vehicle.locomotionModes,
        vehicleSizeCategory: vehicle.vehicleSizeCategory,
      },
    });
    created += 1;
  }

  console.log(
    `Done. JSON vehicle upserts: created ${created}, updated ${updated}, skippedProtected: ${skippedProtected}, vehicles: ${rows.length}.`
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
