import type {
  VehicleAccessType,
  VehicleLocomotion,
  VehicleSizeCategory,
} from "@/app/lib/types/vehicle";

/** Travel speed a newly created vehicle starts at. Existing rows stay as saved. */
const NEW_VEHICLE_TRAVEL_SPEED_KMH = 100;

export type OfficialVehicleCreateDefaults = {
  accessType: VehicleAccessType;
  name: string;
  brand: string;
  year: number | undefined;
  imageKey: string;
  confCost: number;
  costInfo: string;
  description: string;
  notes: string;
  maxHp: number;
  travelSpeedKmh: number;
  combatSpeedMetres: number;
  manoeuvrability: number;
  acceleration: number;
  weight: number | undefined;
  heightMetres: number | undefined;
  maxCargoWeightKg: number | undefined;
  maxMountedItems: number | undefined;
  maxPassengers: number;
  vehicleSizeCategory: VehicleSizeCategory;
  locomotionModes: VehicleLocomotion[];
};

type CustomVehicleCreateFieldDefaults = {
  maxHp: string;
  travelSpeedKmh: string;
  combatSpeedMetres: string;
  manoeuvrability: string;
  acceleration: string;
  maxPassengers: string;
};

type UniqueVehicleCreationMode = "template" | "standalone";

export function officialVehicleCreateDefaults(): OfficialVehicleCreateDefaults {
  return {
    accessType: "PLAYER",
    name: "",
    brand: "",
    year: undefined,
    imageKey: "",
    confCost: 0,
    costInfo: "",
    description: "",
    notes: "",
    maxHp: 1,
    travelSpeedKmh: NEW_VEHICLE_TRAVEL_SPEED_KMH,
    combatSpeedMetres: 1,
    manoeuvrability: 0,
    acceleration: 1,
    weight: undefined,
    heightMetres: undefined,
    maxCargoWeightKg: undefined,
    maxMountedItems: undefined,
    maxPassengers: 1,
    vehicleSizeCategory: "LIGHT",
    locomotionModes: ["LAND"],
  };
}

export function customVehicleCreateFieldDefaults(): CustomVehicleCreateFieldDefaults {
  const official = officialVehicleCreateDefaults();
  return {
    maxHp: String(official.maxHp),
    travelSpeedKmh: String(official.travelSpeedKmh),
    combatSpeedMetres: String(official.combatSpeedMetres),
    manoeuvrability: String(official.manoeuvrability),
    acceleration: String(official.acceleration),
    maxPassengers: String(official.maxPassengers),
  };
}

/** Empty for a template so the template speed applies. 100 km/h for standalone. */
export function uniqueVehicleTravelSpeedOverrideDefault(
  creationMode: UniqueVehicleCreationMode
): string {
  if (creationMode === "standalone") {
    return String(NEW_VEHICLE_TRAVEL_SPEED_KMH);
  }
  return "";
}
