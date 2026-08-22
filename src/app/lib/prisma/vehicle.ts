import type {
  CustomVehicleCreate,
  CustomVehicleUpdate,
  ResolvedVehicle,
  Vehicle as ParsedVehicle,
  VehicleAccessType,
  VehicleLocomotion,
  VehicleSizeCategory,
  VehicleUpdate,
} from "@/app/lib/types/vehicle";
import { prisma } from "./client";

type VehicleRow = {
  id: string;
  accessType: VehicleAccessType;
  name: string;
  brand: string | null;
  year: number | null;
  imageKey: string | null;
  confCost: number;
  costInfo: string | null;
  description: string;
  notes: string | null;
  maxHp: number;
  travelSpeedKmh: number;
  combatSpeedMetres: number;
  manoeuvrability: number;
  acceleration: number;
  weight: number | null;
  heightMetres: number | null;
  maxCargoWeightKg: number | null;
  maxMountedItems: number | null;
  maxPassengers: number;
  locomotionModes: VehicleLocomotion[];
  vehicleSizeCategory: VehicleSizeCategory;
};

type VehicleCreateData = Omit<VehicleRow, "id"> & {
  protectedFromOfficialImport?: boolean;
};

type CustomVehicleRow = Omit<
  VehicleRow,
  "accessType" | "protectedFromOfficialImport" | "confCost" | "description"
> & {
  gameId: string;
  confCost: number | null;
  description: string | null;
  membersCanModify: boolean;
};

type CustomVehicleCreateData = Omit<CustomVehicleRow, "id">;

type CustomVehicleUpdateData = Partial<CustomVehicleCreateData>;

const vehiclePrisma = prisma as typeof prisma & {
  vehicle: {
    findMany(): Promise<VehicleRow[]>;
    findUnique(args: { where: { id: string } }): Promise<VehicleRow | null>;
    create(args: { data: VehicleCreateData }): Promise<VehicleRow>;
    update(args: {
      where: { id: string };
      data: Partial<VehicleCreateData>;
    }): Promise<VehicleRow>;
    delete(args: { where: { id: string } }): Promise<VehicleRow>;
  };
  customVehicle: {
    findMany(args: { where: { gameId: string } }): Promise<CustomVehicleRow[]>;
    findUnique(args: {
      where: { id: string };
    }): Promise<CustomVehicleRow | null>;
    create(args: { data: CustomVehicleCreateData }): Promise<CustomVehicleRow>;
    update(args: {
      where: { id: string };
      data: CustomVehicleUpdateData;
    }): Promise<CustomVehicleRow>;
    delete(args: { where: { id: string } }): Promise<CustomVehicleRow>;
  };
};

export function mapPrismaVehicleToApi(row: VehicleRow): ResolvedVehicle {
  return {
    id: row.id,
    accessType: row.accessType,
    name: row.name,
    brand: row.brand,
    year: row.year,
    imageKey: row.imageKey,
    confCost: row.confCost,
    costInfo: row.costInfo,
    description: row.description,
    notes: row.notes,
    maxHp: row.maxHp,
    travelSpeedKmh: row.travelSpeedKmh,
    combatSpeedMetres: row.combatSpeedMetres,
    manoeuvrability: row.manoeuvrability,
    acceleration: row.acceleration,
    weight: row.weight,
    heightMetres: row.heightMetres,
    maxCargoWeightKg: row.maxCargoWeightKg,
    maxMountedItems: row.maxMountedItems,
    maxPassengers: row.maxPassengers,
    locomotionModes: row.locomotionModes,
    vehicleSizeCategory: row.vehicleSizeCategory,
  };
}

export function mapPrismaCustomVehicleToApi(
  row: CustomVehicleRow
): ResolvedVehicle {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    year: row.year,
    imageKey: row.imageKey,
    confCost: row.confCost,
    costInfo: row.costInfo,
    description: row.description,
    notes: row.notes,
    maxHp: row.maxHp,
    travelSpeedKmh: row.travelSpeedKmh,
    combatSpeedMetres: row.combatSpeedMetres,
    manoeuvrability: row.manoeuvrability,
    acceleration: row.acceleration,
    weight: row.weight,
    heightMetres: row.heightMetres,
    maxCargoWeightKg: row.maxCargoWeightKg,
    maxMountedItems: row.maxMountedItems,
    maxPassengers: row.maxPassengers,
    locomotionModes: row.locomotionModes,
    vehicleSizeCategory: row.vehicleSizeCategory,
    gameId: row.gameId,
    membersCanModify: row.membersCanModify,
  };
}

function vehicleCreateDataFromParsed(
  data: ParsedVehicle,
  options?: { officialCatalogueWrite?: boolean }
): VehicleCreateData {
  return {
    accessType: data.accessType,
    name: data.name,
    brand: data.brand ?? null,
    year: data.year ?? null,
    imageKey: data.imageKey ?? null,
    confCost: data.confCost,
    costInfo: data.costInfo ?? null,
    description: data.description,
    notes: data.notes ?? null,
    maxHp: data.maxHp,
    travelSpeedKmh: data.travelSpeedKmh,
    combatSpeedMetres: data.combatSpeedMetres,
    manoeuvrability: data.manoeuvrability,
    acceleration: data.acceleration,
    weight: data.weight ?? null,
    heightMetres: data.heightMetres ?? null,
    maxCargoWeightKg: data.maxCargoWeightKg ?? null,
    maxMountedItems: data.maxMountedItems ?? null,
    maxPassengers: data.maxPassengers,
    locomotionModes: data.locomotionModes,
    vehicleSizeCategory: data.vehicleSizeCategory,
    ...(options?.officialCatalogueWrite
      ? { protectedFromOfficialImport: true }
      : {}),
  };
}

function vehicleUpdateDataFromParsed(
  data: VehicleUpdate,
  options?: { officialCatalogueWrite?: boolean }
): Partial<VehicleCreateData> {
  return {
    ...(data.accessType !== undefined ? { accessType: data.accessType } : {}),
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.brand !== undefined ? { brand: data.brand ?? null } : {}),
    ...(data.year !== undefined ? { year: data.year ?? null } : {}),
    ...(data.imageKey !== undefined ? { imageKey: data.imageKey ?? null } : {}),
    ...(data.confCost !== undefined ? { confCost: data.confCost } : {}),
    ...(data.costInfo !== undefined ? { costInfo: data.costInfo ?? null } : {}),
    ...(data.description !== undefined
      ? { description: data.description }
      : {}),
    ...(data.notes !== undefined ? { notes: data.notes ?? null } : {}),
    ...(data.maxHp !== undefined ? { maxHp: data.maxHp } : {}),
    ...(data.travelSpeedKmh !== undefined
      ? { travelSpeedKmh: data.travelSpeedKmh }
      : {}),
    ...(data.combatSpeedMetres !== undefined
      ? { combatSpeedMetres: data.combatSpeedMetres }
      : {}),
    ...(data.manoeuvrability !== undefined
      ? { manoeuvrability: data.manoeuvrability }
      : {}),
    ...(data.acceleration !== undefined
      ? { acceleration: data.acceleration }
      : {}),
    ...(data.weight !== undefined ? { weight: data.weight ?? null } : {}),
    ...(data.heightMetres !== undefined
      ? { heightMetres: data.heightMetres ?? null }
      : {}),
    ...(data.maxCargoWeightKg !== undefined
      ? { maxCargoWeightKg: data.maxCargoWeightKg ?? null }
      : {}),
    ...(data.maxMountedItems !== undefined
      ? { maxMountedItems: data.maxMountedItems ?? null }
      : {}),
    ...(data.maxPassengers !== undefined
      ? { maxPassengers: data.maxPassengers }
      : {}),
    ...(data.locomotionModes !== undefined
      ? { locomotionModes: data.locomotionModes }
      : {}),
    ...(data.vehicleSizeCategory !== undefined
      ? { vehicleSizeCategory: data.vehicleSizeCategory }
      : {}),
    ...(options?.officialCatalogueWrite
      ? { protectedFromOfficialImport: true }
      : {}),
  };
}

function customVehicleCreateDataFromParsed(
  data: CustomVehicleCreate
): CustomVehicleCreateData {
  return {
    gameId: data.gameId,
    name: data.name,
    brand: data.brand ?? null,
    year: data.year ?? null,
    imageKey: data.imageKey ?? null,
    confCost: data.confCost ?? null,
    costInfo: data.costInfo ?? null,
    description: data.description ?? null,
    notes: data.notes ?? null,
    maxHp: data.maxHp,
    travelSpeedKmh: data.travelSpeedKmh,
    combatSpeedMetres: data.combatSpeedMetres,
    manoeuvrability: data.manoeuvrability,
    acceleration: data.acceleration,
    weight: data.weight ?? null,
    heightMetres: data.heightMetres ?? null,
    maxCargoWeightKg: data.maxCargoWeightKg ?? null,
    maxMountedItems: data.maxMountedItems ?? null,
    maxPassengers: data.maxPassengers,
    locomotionModes: data.locomotionModes,
    vehicleSizeCategory: data.vehicleSizeCategory,
    membersCanModify: data.membersCanModify ?? false,
  };
}

function customVehicleUpdateDataFromParsed(
  data: CustomVehicleUpdate
): CustomVehicleUpdateData {
  return {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.brand !== undefined ? { brand: data.brand ?? null } : {}),
    ...(data.year !== undefined ? { year: data.year ?? null } : {}),
    ...(data.imageKey !== undefined ? { imageKey: data.imageKey ?? null } : {}),
    ...(data.confCost !== undefined ? { confCost: data.confCost ?? null } : {}),
    ...(data.costInfo !== undefined ? { costInfo: data.costInfo ?? null } : {}),
    ...(data.description !== undefined
      ? { description: data.description ?? null }
      : {}),
    ...(data.notes !== undefined ? { notes: data.notes ?? null } : {}),
    ...(data.maxHp !== undefined ? { maxHp: data.maxHp } : {}),
    ...(data.travelSpeedKmh !== undefined
      ? { travelSpeedKmh: data.travelSpeedKmh }
      : {}),
    ...(data.combatSpeedMetres !== undefined
      ? { combatSpeedMetres: data.combatSpeedMetres }
      : {}),
    ...(data.manoeuvrability !== undefined
      ? { manoeuvrability: data.manoeuvrability }
      : {}),
    ...(data.acceleration !== undefined
      ? { acceleration: data.acceleration }
      : {}),
    ...(data.weight !== undefined ? { weight: data.weight ?? null } : {}),
    ...(data.heightMetres !== undefined
      ? { heightMetres: data.heightMetres ?? null }
      : {}),
    ...(data.maxCargoWeightKg !== undefined
      ? { maxCargoWeightKg: data.maxCargoWeightKg ?? null }
      : {}),
    ...(data.maxMountedItems !== undefined
      ? { maxMountedItems: data.maxMountedItems ?? null }
      : {}),
    ...(data.maxPassengers !== undefined
      ? { maxPassengers: data.maxPassengers }
      : {}),
    ...(data.locomotionModes !== undefined
      ? { locomotionModes: data.locomotionModes }
      : {}),
    ...(data.vehicleSizeCategory !== undefined
      ? { vehicleSizeCategory: data.vehicleSizeCategory }
      : {}),
    ...(data.membersCanModify !== undefined
      ? { membersCanModify: data.membersCanModify }
      : {}),
  };
}

export async function createVehicle(
  data: ParsedVehicle,
  options?: { officialCatalogueWrite?: boolean }
) {
  const row = await vehiclePrisma.vehicle.create({
    data: vehicleCreateDataFromParsed(data, options),
  });
  return mapPrismaVehicleToApi(row);
}

export async function getVehicle(id: string) {
  const row = await vehiclePrisma.vehicle.findUnique({ where: { id } });
  return row ? mapPrismaVehicleToApi(row) : null;
}

export async function getVehicles() {
  const rows = await vehiclePrisma.vehicle.findMany();
  return rows.map(mapPrismaVehicleToApi);
}

export async function updateVehicle(
  id: string,
  data: VehicleUpdate,
  options?: { officialCatalogueWrite?: boolean }
) {
  const row = await vehiclePrisma.vehicle.update({
    where: { id },
    data: vehicleUpdateDataFromParsed(data, options),
  });
  return mapPrismaVehicleToApi(row);
}

export async function deleteVehicle(id: string) {
  return vehiclePrisma.vehicle.delete({ where: { id } });
}

export async function createCustomVehicle(data: CustomVehicleCreate) {
  const row = await vehiclePrisma.customVehicle.create({
    data: customVehicleCreateDataFromParsed(data),
  });
  return mapPrismaCustomVehicleToApi(row);
}

export async function getCustomVehicle(id: string) {
  const row = await vehiclePrisma.customVehicle.findUnique({ where: { id } });
  return row ? mapPrismaCustomVehicleToApi(row) : null;
}

export async function getCustomVehiclesByGame(gameId: string) {
  const rows = await vehiclePrisma.customVehicle.findMany({
    where: { gameId },
  });
  return rows.map(mapPrismaCustomVehicleToApi);
}

export async function updateCustomVehicle(
  id: string,
  data: CustomVehicleUpdate
) {
  const row = await vehiclePrisma.customVehicle.update({
    where: { id },
    data: customVehicleUpdateDataFromParsed(data),
  });
  return mapPrismaCustomVehicleToApi(row);
}

export async function deleteCustomVehicle(id: string) {
  return vehiclePrisma.customVehicle.delete({ where: { id } });
}
