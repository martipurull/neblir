import type {
  ResolvedVehicle,
  UniqueVehicleCreate,
  UniqueVehicleDetailResponse,
  UniqueVehicleListItem,
  UniqueVehicleRecord,
  UniqueVehicleUpdate,
  VehicleLocomotion,
  VehicleSizeCategory,
  VehicleSourceType,
} from "@/app/lib/types/vehicle";
import type { Prisma } from "@prisma/client";
import { prisma } from "./client";
import { mapPrismaCustomVehicleToApi, mapPrismaVehicleToApi } from "./vehicle";

type UniqueVehicleRow = {
  id: string;
  ownerUserId: string;
  gameId: string;
  sourceType: VehicleSourceType;
  vehicleId: string | null;
  nameOverride: string | null;
  brandOverride: string | null;
  yearOverride: number | null;
  imageKeyOverride: string | null;
  confCostOverride: number | null;
  costInfoOverride: string | null;
  descriptionOverride: string | null;
  notesOverride: string | null;
  maxHpOverride: number | null;
  travelSpeedKmhOverride: number | null;
  combatSpeedMetresOverride: number | null;
  manoeuvrabilityOverride: number | null;
  accelerationOverride: number | null;
  weightOverride: number | null;
  heightMetresOverride: number | null;
  maxCargoWeightKgOverride: number | null;
  maxMountedItemsOverride: number | null;
  maxPassengersOverride: number | null;
  locomotionModesOverride: unknown;
  vehicleSizeCategoryOverride: VehicleSizeCategory | null;
  specialTag: string | null;
};

type UniqueVehicleCreateData = Omit<UniqueVehicleRow, "id">;
type UniqueVehicleUpdateData = Partial<
  Omit<
    UniqueVehicleCreateData,
    "ownerUserId" | "gameId" | "sourceType" | "vehicleId"
  >
>;

type VehicleTemplateNameRow = { name: string };
type CustomVehicleTemplateNameRow = { name: string };

const uniqueVehiclePrisma = prisma as typeof prisma & {
  uniqueVehicle: {
    create(args: { data: UniqueVehicleCreateData }): Promise<UniqueVehicleRow>;
    findMany(args: {
      where: { gameId: string } | { ownerUserId: string; gameId: string };
      select: {
        id: true;
        ownerUserId: true;
        nameOverride: true;
        sourceType: true;
        vehicleId: true;
      };
      orderBy: { id: "asc" };
    }): Promise<
      Array<{
        id: string;
        ownerUserId: string;
        nameOverride: string | null;
        sourceType: VehicleSourceType;
        vehicleId: string;
      }>
    >;
    findUnique(args: {
      where: { id: string };
    }): Promise<UniqueVehicleRow | null>;
    update(args: {
      where: { id: string };
      data: UniqueVehicleUpdateData;
    }): Promise<UniqueVehicleRow>;
    delete(args: { where: { id: string } }): Promise<UniqueVehicleRow>;
  };
  vehicle: {
    findUnique(args: { where: { id: string } }): Promise<unknown>;
    findUnique(args: {
      where: { id: string };
      select: { name: true };
    }): Promise<VehicleTemplateNameRow | null>;
  };
  customVehicle: {
    findUnique(args: { where: { id: string } }): Promise<unknown>;
    findUnique(args: {
      where: { id: string };
      select: { name: true };
    }): Promise<CustomVehicleTemplateNameRow | null>;
  };
};

function mapUniqueVehicleRowToRecord(
  row: UniqueVehicleRow
): UniqueVehicleRecord {
  const sourceType =
    row.sourceType === "CUSTOM_VEHICLE"
      ? "CUSTOM_VEHICLE"
      : row.sourceType === "STANDALONE"
        ? "STANDALONE"
        : "GLOBAL_VEHICLE";

  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    gameId: row.gameId,
    sourceType,
    ...(row.vehicleId != null ? { vehicleId: row.vehicleId } : {}),
    ...(row.nameOverride != null ? { nameOverride: row.nameOverride } : {}),
    ...(row.brandOverride != null ? { brandOverride: row.brandOverride } : {}),
    ...(row.yearOverride != null ? { yearOverride: row.yearOverride } : {}),
    ...(row.imageKeyOverride != null
      ? { imageKeyOverride: row.imageKeyOverride }
      : {}),
    ...(row.confCostOverride != null
      ? { confCostOverride: row.confCostOverride }
      : {}),
    ...(row.costInfoOverride != null
      ? { costInfoOverride: row.costInfoOverride }
      : {}),
    ...(row.descriptionOverride != null
      ? { descriptionOverride: row.descriptionOverride }
      : {}),
    ...(row.notesOverride != null ? { notesOverride: row.notesOverride } : {}),
    ...(row.maxHpOverride != null ? { maxHpOverride: row.maxHpOverride } : {}),
    ...(row.travelSpeedKmhOverride != null
      ? { travelSpeedKmhOverride: row.travelSpeedKmhOverride }
      : {}),
    ...(row.combatSpeedMetresOverride != null
      ? { combatSpeedMetresOverride: row.combatSpeedMetresOverride }
      : {}),
    ...(row.manoeuvrabilityOverride != null
      ? { manoeuvrabilityOverride: row.manoeuvrabilityOverride }
      : {}),
    ...(row.accelerationOverride != null
      ? { accelerationOverride: row.accelerationOverride }
      : {}),
    ...(row.weightOverride != null
      ? { weightOverride: row.weightOverride }
      : {}),
    ...(row.heightMetresOverride != null
      ? { heightMetresOverride: row.heightMetresOverride }
      : {}),
    ...(row.maxCargoWeightKgOverride != null
      ? { maxCargoWeightKgOverride: row.maxCargoWeightKgOverride }
      : {}),
    ...(row.maxMountedItemsOverride != null
      ? { maxMountedItemsOverride: row.maxMountedItemsOverride }
      : {}),
    ...(row.maxPassengersOverride != null
      ? { maxPassengersOverride: row.maxPassengersOverride }
      : {}),
    ...(overrideLocomotionModes(row) !== undefined
      ? { locomotionModesOverride: overrideLocomotionModes(row) }
      : {}),
    ...(row.vehicleSizeCategoryOverride != null
      ? { vehicleSizeCategoryOverride: row.vehicleSizeCategoryOverride }
      : {}),
    ...(row.specialTag != null ? { specialTag: row.specialTag } : {}),
  };
}

export function uniqueVehicleCreateDataFromParsed(
  ownerUserId: string,
  gameId: string,
  parsed: UniqueVehicleCreate
): UniqueVehicleCreateData {
  const mutableFields = {
    nameOverride: parsed.nameOverride ?? null,
    brandOverride: parsed.brandOverride ?? null,
    yearOverride: parsed.yearOverride ?? null,
    imageKeyOverride: parsed.imageKeyOverride ?? null,
    confCostOverride: parsed.confCostOverride ?? null,
    costInfoOverride: parsed.costInfoOverride ?? null,
    descriptionOverride: parsed.descriptionOverride ?? null,
    notesOverride: parsed.notesOverride ?? null,
    maxHpOverride: parsed.maxHpOverride ?? null,
    travelSpeedKmhOverride: parsed.travelSpeedKmhOverride ?? null,
    combatSpeedMetresOverride: parsed.combatSpeedMetresOverride ?? null,
    manoeuvrabilityOverride: parsed.manoeuvrabilityOverride ?? null,
    accelerationOverride: parsed.accelerationOverride ?? null,
    weightOverride: parsed.weightOverride ?? null,
    heightMetresOverride: parsed.heightMetresOverride ?? null,
    maxCargoWeightKgOverride: parsed.maxCargoWeightKgOverride ?? null,
    maxMountedItemsOverride: parsed.maxMountedItemsOverride ?? null,
    maxPassengersOverride: parsed.maxPassengersOverride ?? null,
    locomotionModesOverride: parsed.locomotionModesOverride ?? null,
    vehicleSizeCategoryOverride: parsed.vehicleSizeCategoryOverride ?? null,
    specialTag: parsed.specialTag ?? null,
  };

  if (parsed.sourceType === "STANDALONE") {
    return {
      ownerUserId,
      gameId,
      sourceType: "STANDALONE",
      vehicleId: null,
      ...mutableFields,
    };
  }

  return {
    ownerUserId,
    gameId,
    sourceType: parsed.sourceType,
    vehicleId: parsed.vehicleId,
    ...mutableFields,
  };
}

function uniqueVehicleUpdateDataFromParsed(
  parsed: UniqueVehicleUpdate
): UniqueVehicleUpdateData {
  return {
    ...(parsed.nameOverride !== undefined
      ? { nameOverride: parsed.nameOverride ?? null }
      : {}),
    ...(parsed.brandOverride !== undefined
      ? { brandOverride: parsed.brandOverride ?? null }
      : {}),
    ...(parsed.yearOverride !== undefined
      ? { yearOverride: parsed.yearOverride ?? null }
      : {}),
    ...(parsed.imageKeyOverride !== undefined
      ? { imageKeyOverride: parsed.imageKeyOverride ?? null }
      : {}),
    ...(parsed.confCostOverride !== undefined
      ? { confCostOverride: parsed.confCostOverride ?? null }
      : {}),
    ...(parsed.costInfoOverride !== undefined
      ? { costInfoOverride: parsed.costInfoOverride ?? null }
      : {}),
    ...(parsed.descriptionOverride !== undefined
      ? { descriptionOverride: parsed.descriptionOverride ?? null }
      : {}),
    ...(parsed.notesOverride !== undefined
      ? { notesOverride: parsed.notesOverride ?? null }
      : {}),
    ...(parsed.maxHpOverride !== undefined
      ? { maxHpOverride: parsed.maxHpOverride ?? null }
      : {}),
    ...(parsed.travelSpeedKmhOverride !== undefined
      ? { travelSpeedKmhOverride: parsed.travelSpeedKmhOverride ?? null }
      : {}),
    ...(parsed.combatSpeedMetresOverride !== undefined
      ? { combatSpeedMetresOverride: parsed.combatSpeedMetresOverride ?? null }
      : {}),
    ...(parsed.manoeuvrabilityOverride !== undefined
      ? { manoeuvrabilityOverride: parsed.manoeuvrabilityOverride ?? null }
      : {}),
    ...(parsed.accelerationOverride !== undefined
      ? { accelerationOverride: parsed.accelerationOverride ?? null }
      : {}),
    ...(parsed.weightOverride !== undefined
      ? { weightOverride: parsed.weightOverride ?? null }
      : {}),
    ...(parsed.heightMetresOverride !== undefined
      ? { heightMetresOverride: parsed.heightMetresOverride ?? null }
      : {}),
    ...(parsed.maxCargoWeightKgOverride !== undefined
      ? { maxCargoWeightKgOverride: parsed.maxCargoWeightKgOverride ?? null }
      : {}),
    ...(parsed.maxMountedItemsOverride !== undefined
      ? { maxMountedItemsOverride: parsed.maxMountedItemsOverride ?? null }
      : {}),
    ...(parsed.maxPassengersOverride !== undefined
      ? { maxPassengersOverride: parsed.maxPassengersOverride ?? null }
      : {}),
    ...(parsed.locomotionModesOverride !== undefined
      ? { locomotionModesOverride: parsed.locomotionModesOverride ?? null }
      : {}),
    ...(parsed.vehicleSizeCategoryOverride !== undefined
      ? {
          vehicleSizeCategoryOverride:
            parsed.vehicleSizeCategoryOverride ?? null,
        }
      : {}),
    ...(parsed.specialTag !== undefined
      ? { specialTag: parsed.specialTag ?? null }
      : {}),
  };
}

function toPrismaUniqueVehicleCreate(
  data: UniqueVehicleCreateData
): Prisma.UniqueVehicleUncheckedCreateInput {
  const entries = Object.entries(data).filter(
    ([key, value]) =>
      value !== null &&
      value !== undefined &&
      !(key === "vehicleId" && value === null)
  );
  return Object.fromEntries(
    entries
  ) as Prisma.UniqueVehicleUncheckedCreateInput;
}

export async function createUniqueVehicle(data: UniqueVehicleCreateData) {
  const row = await prisma.uniqueVehicle.create({
    data: toPrismaUniqueVehicleCreate(data),
  });
  return mapUniqueVehicleRowToRecord(row);
}

export async function getUniqueVehicle(id: string) {
  const row = await uniqueVehiclePrisma.uniqueVehicle.findUnique({
    where: { id },
  });
  return row ? mapUniqueVehicleRowToRecord(row) : null;
}

function overrideLocomotionModes(
  uniqueVehicle: UniqueVehicleRow
): VehicleLocomotion[] | undefined {
  const value = uniqueVehicle.locomotionModesOverride;
  if (value == null || !Array.isArray(value)) return undefined;
  return value.filter(
    (mode): mode is VehicleLocomotion =>
      mode === "LAND" || mode === "AIR" || mode === "SEA" || mode === "SNOW"
  );
}

/** Resolved vehicle when there is no global/custom template. */
function buildStandaloneResolvedVehicle(
  uniqueVehicle: UniqueVehicleRow
): ResolvedVehicle {
  const locomotionModes = overrideLocomotionModes(uniqueVehicle) ?? [];
  const name =
    uniqueVehicle.nameOverride?.trim() !== ""
      ? (uniqueVehicle.nameOverride ?? "Unknown vehicle")
      : "Unknown vehicle";

  return {
    id: uniqueVehicle.id,
    name,
    brand: uniqueVehicle.brandOverride,
    year: uniqueVehicle.yearOverride,
    imageKey: uniqueVehicle.imageKeyOverride,
    confCost: uniqueVehicle.confCostOverride ?? 0,
    costInfo: uniqueVehicle.costInfoOverride,
    description: uniqueVehicle.descriptionOverride ?? "",
    notes: uniqueVehicle.notesOverride,
    maxHp: uniqueVehicle.maxHpOverride ?? 0,
    travelSpeedKmh: uniqueVehicle.travelSpeedKmhOverride ?? 0,
    combatSpeedMetres: uniqueVehicle.combatSpeedMetresOverride ?? 0,
    manoeuvrability: uniqueVehicle.manoeuvrabilityOverride ?? 0,
    acceleration: uniqueVehicle.accelerationOverride ?? 1,
    weight: uniqueVehicle.weightOverride,
    heightMetres: uniqueVehicle.heightMetresOverride,
    maxCargoWeightKg: uniqueVehicle.maxCargoWeightKgOverride,
    maxMountedItems: uniqueVehicle.maxMountedItemsOverride,
    maxPassengers: uniqueVehicle.maxPassengersOverride ?? 1,
    locomotionModes,
    vehicleSizeCategory: uniqueVehicle.vehicleSizeCategoryOverride,
    specialTag: uniqueVehicle.specialTag,
    _resolvedFrom: "UNIQUE_VEHICLE",
    _uniqueVehicleId: uniqueVehicle.id,
    gameId: uniqueVehicle.gameId,
  };
}

function applyUniqueVehicleOverrides(
  uniqueVehicle: UniqueVehicleRow,
  templateVehicle: ResolvedVehicle
): ResolvedVehicle {
  const locomotionModes = overrideLocomotionModes(uniqueVehicle);

  return {
    ...templateVehicle,
    ...(uniqueVehicle.nameOverride != null && {
      name: uniqueVehicle.nameOverride,
    }),
    ...(uniqueVehicle.brandOverride != null && {
      brand: uniqueVehicle.brandOverride,
    }),
    ...(uniqueVehicle.yearOverride != null && {
      year: uniqueVehicle.yearOverride,
    }),
    ...(uniqueVehicle.imageKeyOverride != null && {
      imageKey: uniqueVehicle.imageKeyOverride,
    }),
    ...(uniqueVehicle.confCostOverride != null && {
      confCost: uniqueVehicle.confCostOverride,
    }),
    ...(uniqueVehicle.costInfoOverride != null && {
      costInfo: uniqueVehicle.costInfoOverride,
    }),
    ...(uniqueVehicle.descriptionOverride != null && {
      description: uniqueVehicle.descriptionOverride,
    }),
    ...(uniqueVehicle.notesOverride != null && {
      notes: uniqueVehicle.notesOverride,
    }),
    ...(uniqueVehicle.maxHpOverride != null && {
      maxHp: uniqueVehicle.maxHpOverride,
    }),
    ...(uniqueVehicle.travelSpeedKmhOverride != null && {
      travelSpeedKmh: uniqueVehicle.travelSpeedKmhOverride,
    }),
    ...(uniqueVehicle.combatSpeedMetresOverride != null && {
      combatSpeedMetres: uniqueVehicle.combatSpeedMetresOverride,
    }),
    ...(uniqueVehicle.manoeuvrabilityOverride != null && {
      manoeuvrability: uniqueVehicle.manoeuvrabilityOverride,
    }),
    ...(uniqueVehicle.accelerationOverride != null && {
      acceleration: uniqueVehicle.accelerationOverride,
    }),
    ...(uniqueVehicle.weightOverride != null && {
      weight: uniqueVehicle.weightOverride,
    }),
    ...(uniqueVehicle.heightMetresOverride != null && {
      heightMetres: uniqueVehicle.heightMetresOverride,
    }),
    ...(uniqueVehicle.maxCargoWeightKgOverride != null && {
      maxCargoWeightKg: uniqueVehicle.maxCargoWeightKgOverride,
    }),
    ...(uniqueVehicle.maxMountedItemsOverride != null && {
      maxMountedItems: uniqueVehicle.maxMountedItemsOverride,
    }),
    ...(uniqueVehicle.maxPassengersOverride != null && {
      maxPassengers: uniqueVehicle.maxPassengersOverride,
    }),
    ...(locomotionModes !== undefined && {
      locomotionModes,
    }),
    ...(uniqueVehicle.vehicleSizeCategoryOverride != null && {
      vehicleSizeCategory: uniqueVehicle.vehicleSizeCategoryOverride,
    }),
    specialTag: uniqueVehicle.specialTag,
    _resolvedFrom: "UNIQUE_VEHICLE",
    _uniqueVehicleId: uniqueVehicle.id,
    gameId: uniqueVehicle.gameId,
  };
}

export async function getResolvedUniqueVehicle(
  id: string
): Promise<UniqueVehicleDetailResponse | null> {
  const uniqueVehicle = await uniqueVehiclePrisma.uniqueVehicle.findUnique({
    where: { id },
  });
  if (!uniqueVehicle) return null;

  const base = mapUniqueVehicleRowToRecord(uniqueVehicle);

  if (uniqueVehicle.sourceType === "STANDALONE") {
    return {
      ...base,
      templateVehicle: null,
      resolvedVehicle: buildStandaloneResolvedVehicle(uniqueVehicle),
    };
  }

  if (uniqueVehicle.sourceType === "GLOBAL_VEHICLE") {
    if (!uniqueVehicle.vehicleId) {
      return { ...base, templateVehicle: null, resolvedVehicle: null };
    }
    const template = await uniqueVehiclePrisma.vehicle.findUnique({
      where: { id: uniqueVehicle.vehicleId },
    });
    if (!template) {
      return { ...base, templateVehicle: null, resolvedVehicle: null };
    }
    const templateVehicle = mapPrismaVehicleToApi(
      template as Parameters<typeof mapPrismaVehicleToApi>[0]
    );
    return {
      ...base,
      templateVehicle,
      resolvedVehicle: applyUniqueVehicleOverrides(
        uniqueVehicle,
        templateVehicle
      ),
    };
  }

  if (uniqueVehicle.sourceType === "CUSTOM_VEHICLE") {
    if (!uniqueVehicle.vehicleId) {
      return { ...base, templateVehicle: null, resolvedVehicle: null };
    }
    const template = await uniqueVehiclePrisma.customVehicle.findUnique({
      where: { id: uniqueVehicle.vehicleId },
    });
    if (!template) {
      return { ...base, templateVehicle: null, resolvedVehicle: null };
    }
    const templateVehicle = mapPrismaCustomVehicleToApi(
      template as Parameters<typeof mapPrismaCustomVehicleToApi>[0]
    );
    return {
      ...base,
      templateVehicle,
      resolvedVehicle: applyUniqueVehicleOverrides(
        uniqueVehicle,
        templateVehicle
      ),
    };
  }

  return { ...base, templateVehicle: null, resolvedVehicle: null };
}

export async function resolveUniqueVehicle(
  id: string
): Promise<ResolvedVehicle | null> {
  const resolved = await getResolvedUniqueVehicle(id);
  return resolved?.resolvedVehicle ?? null;
}

export async function getUniqueVehiclesByGameId(
  gameId: string,
  ownerUserId?: string
): Promise<UniqueVehicleListItem[]> {
  const vehicles = await uniqueVehiclePrisma.uniqueVehicle.findMany({
    where: ownerUserId ? { ownerUserId, gameId } : { gameId },
    select: {
      id: true,
      ownerUserId: true,
      nameOverride: true,
      sourceType: true,
      vehicleId: true,
    },
    orderBy: { id: "asc" },
  });

  return Promise.all(
    vehicles.map(async (vehicle) => {
      if (vehicle.sourceType === "STANDALONE") {
        const trimmedNameOverride = vehicle.nameOverride?.trim();
        return {
          id: vehicle.id,
          ownerUserId: vehicle.ownerUserId,
          name:
            trimmedNameOverride === "" || trimmedNameOverride == null
              ? "Unknown vehicle"
              : trimmedNameOverride,
        };
      }

      const templateName =
        vehicle.sourceType === "GLOBAL_VEHICLE" && vehicle.vehicleId
          ? (
              await uniqueVehiclePrisma.vehicle.findUnique({
                where: { id: vehicle.vehicleId },
                select: { name: true },
              })
            )?.name
          : vehicle.vehicleId
            ? (
                await uniqueVehiclePrisma.customVehicle.findUnique({
                  where: { id: vehicle.vehicleId },
                  select: { name: true },
                })
              )?.name
            : undefined;

      const trimmedNameOverride = vehicle.nameOverride?.trim();
      return {
        id: vehicle.id,
        ownerUserId: vehicle.ownerUserId,
        name:
          trimmedNameOverride === ""
            ? (templateName ?? "Unknown vehicle")
            : (trimmedNameOverride ?? templateName ?? "Unknown vehicle"),
      };
    })
  );
}

export async function updateUniqueVehicle(
  id: string,
  data: UniqueVehicleUpdate
) {
  const row = await uniqueVehiclePrisma.uniqueVehicle.update({
    where: { id },
    data: uniqueVehicleUpdateDataFromParsed(data),
  });
  return mapUniqueVehicleRowToRecord(row);
}

export async function deleteUniqueVehicle(id: string) {
  return uniqueVehiclePrisma.uniqueVehicle.delete({ where: { id } });
}
