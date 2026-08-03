import { z } from "zod";

const vehicleAccessTypeSchema = z.enum(["PLAYER", "GAME_MASTER"]);
export type VehicleAccessType = z.infer<typeof vehicleAccessTypeSchema>;

const vehicleSourceTypeSchema = z.enum([
  "GLOBAL_VEHICLE",
  "CUSTOM_VEHICLE",
  "UNIQUE_VEHICLE",
]);
export type VehicleSourceType = z.infer<typeof vehicleSourceTypeSchema>;

const uniqueVehicleTemplateSourceTypeSchema = z.enum([
  "GLOBAL_VEHICLE",
  "CUSTOM_VEHICLE",
]);

const vehicleLocomotionSchema = z.enum(["LAND", "AIR", "SEA", "SNOW"]);
export type VehicleLocomotion = z.infer<typeof vehicleLocomotionSchema>;

const vehicleSizeCategorySchema = z.enum(["LIGHT", "STANDARD", "HEAVY"]);
export type VehicleSizeCategory = z.infer<typeof vehicleSizeCategorySchema>;

const vehicleDerivedStatusSchema = z.enum([
  "OPERATIONAL",
  "BROKEN_DOWN",
  "BEYOND_REPAIR",
]);
export type VehicleDerivedStatus = z.infer<typeof vehicleDerivedStatusSchema>;

const locomotionModesSchema = z
  .array(vehicleLocomotionSchema)
  .min(1, "Select at least one locomotion mode")
  .superRefine((modes, ctx) => {
    const seen = new Set<VehicleLocomotion>();
    for (const mode of modes) {
      if (seen.has(mode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate locomotion mode '${mode}' is not allowed.`,
        });
      }
      seen.add(mode);
    }
  });

export const resolvedVehicleSchema = z.object({
  id: z.string().optional(),
  accessType: vehicleAccessTypeSchema.optional().nullable(),
  name: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  imageKey: z.string().optional().nullable(),
  confCost: z.number().int().optional().nullable(),
  costInfo: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  maxHp: z.number().int().optional().nullable(),
  travelSpeedKmh: z.number().int().optional().nullable(),
  combatSpeedMetres: z.number().int().optional().nullable(),
  manoeuvrability: z.number().int().optional().nullable(),
  weight: z.number().optional().nullable(),
  heightMetres: z.number().optional().nullable(),
  maxCargoWeightKg: z.number().optional().nullable(),
  maxMountedItems: z.number().int().optional().nullable(),
  maxPassengers: z.number().int().optional().nullable(),
  locomotionModes: z.array(vehicleLocomotionSchema).optional().default([]),
  vehicleSizeCategory: vehicleSizeCategorySchema.optional().nullable(),
  specialTag: z.string().optional().nullable(),
  _resolvedFrom: z.literal("UNIQUE_VEHICLE").optional(),
  _uniqueVehicleId: z.string().nullish(),
  gameId: z.string().optional().nullable(),
});

export const vehicleSchema = z.object({
  accessType: vehicleAccessTypeSchema,
  name: z.string().trim().min(1, "Name is required"),
  brand: z.string().trim().min(1).optional(),
  year: z.number().int().optional().nullable(),
  imageKey: z.string().optional().nullable(),
  confCost: z.number().int(),
  costInfo: z.string().optional().nullable(),
  description: z.string(),
  notes: z.string().optional().nullable(),
  maxHp: z.number().int(),
  travelSpeedKmh: z.number().int(),
  combatSpeedMetres: z.number().int(),
  manoeuvrability: z.number().int(),
  weight: z.number().finite().optional().nullable(),
  heightMetres: z.number().finite().optional().nullable(),
  maxCargoWeightKg: z.number().finite().optional().nullable(),
  maxMountedItems: z.number().int().optional().nullable(),
  maxPassengers: z.number().int().min(1),
  locomotionModes: locomotionModesSchema,
  vehicleSizeCategory: vehicleSizeCategorySchema,
});
export type Vehicle = z.infer<typeof vehicleSchema>;

export const vehicleUpdateSchema = vehicleSchema.partial();
export type VehicleUpdate = z.infer<typeof vehicleUpdateSchema>;

export const customVehicleCreateSchema = z.object({
  gameId: z.string(),
  name: z.string().trim().min(1, "Name is required"),
  brand: z.string().trim().min(1).optional(),
  year: z.number().int().optional().nullable(),
  imageKey: z.string().optional().nullable(),
  confCost: z.number().int().optional().nullable(),
  costInfo: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  maxHp: z.number().int(),
  travelSpeedKmh: z.number().int(),
  combatSpeedMetres: z.number().int(),
  manoeuvrability: z.number().int(),
  weight: z.number().finite().optional().nullable(),
  heightMetres: z.number().finite().optional().nullable(),
  maxCargoWeightKg: z.number().finite().optional().nullable(),
  maxMountedItems: z.number().int().optional().nullable(),
  maxPassengers: z.number().int().min(1),
  locomotionModes: locomotionModesSchema,
  vehicleSizeCategory: vehicleSizeCategorySchema,
});
export type CustomVehicleCreate = z.infer<typeof customVehicleCreateSchema>;

export const customVehicleUpdateSchema = customVehicleCreateSchema
  .omit({ gameId: true })
  .partial();
export type CustomVehicleUpdate = z.infer<typeof customVehicleUpdateSchema>;

export const customVehicleResponseSchema = customVehicleCreateSchema.extend({
  id: z.string(),
});
export type CustomVehicleResponse = z.infer<typeof customVehicleResponseSchema>;

export const customVehicleListResponseSchema = z.array(
  customVehicleResponseSchema
);

const uniqueVehicleMutableBodySchema = z.object({
  gameId: z.string(),
  nameOverride: z.string().trim().min(1).optional(),
  brandOverride: z.string().trim().min(1).optional(),
  yearOverride: z.number().int().optional().nullable(),
  imageKeyOverride: z.string().optional().nullable(),
  confCostOverride: z.number().int().optional().nullable(),
  costInfoOverride: z.string().optional().nullable(),
  descriptionOverride: z.string().optional().nullable(),
  notesOverride: z.string().optional().nullable(),
  maxHpOverride: z.number().int().optional().nullable(),
  travelSpeedKmhOverride: z.number().int().optional().nullable(),
  combatSpeedMetresOverride: z.number().int().optional().nullable(),
  manoeuvrabilityOverride: z.number().int().optional().nullable(),
  weightOverride: z.number().finite().optional().nullable(),
  heightMetresOverride: z.number().finite().optional().nullable(),
  maxCargoWeightKgOverride: z.number().finite().optional().nullable(),
  maxMountedItemsOverride: z.number().int().optional().nullable(),
  maxPassengersOverride: z.number().int().min(1).optional().nullable(),
  locomotionModesOverride: locomotionModesSchema.optional(),
  vehicleSizeCategoryOverride: vehicleSizeCategorySchema.optional().nullable(),
  specialTag: z.string().optional().nullable(),
});

export const uniqueVehicleCreateSchema = z.union([
  uniqueVehicleMutableBodySchema.extend({
    sourceType: z.literal("GLOBAL_VEHICLE"),
    vehicleId: z.string(),
  }),
  uniqueVehicleMutableBodySchema.extend({
    sourceType: z.literal("CUSTOM_VEHICLE"),
    vehicleId: z.string(),
  }),
]);
export type UniqueVehicleCreate = z.infer<typeof uniqueVehicleCreateSchema>;

export const uniqueVehicleUpdateSchema = uniqueVehicleMutableBodySchema
  .omit({ gameId: true })
  .partial();
export type UniqueVehicleUpdate = z.infer<typeof uniqueVehicleUpdateSchema>;

const uniqueVehicleRecordSchema = uniqueVehicleMutableBodySchema.extend({
  id: z.string(),
  ownerUserId: z.string(),
  gameId: z.string(),
  sourceType: uniqueVehicleTemplateSourceTypeSchema,
  vehicleId: z.string(),
});
export type UniqueVehicleRecord = z.infer<typeof uniqueVehicleRecordSchema>;

export const uniqueVehicleDetailResponseSchema =
  uniqueVehicleRecordSchema.extend({
    templateVehicle: resolvedVehicleSchema.nullable(),
    resolvedVehicle: resolvedVehicleSchema.nullable(),
  });
export type UniqueVehicleDetailResponse = z.infer<
  typeof uniqueVehicleDetailResponseSchema
>;

const uniqueVehicleListItemSchema = z.object({
  id: z.string(),
  ownerUserId: z.string(),
  name: z.string(),
});
export type UniqueVehicleListItem = z.infer<typeof uniqueVehicleListItemSchema>;

export const uniqueVehicleListResponseSchema = z.array(
  uniqueVehicleListItemSchema
);

const vehicleMountedItemSummarySchema = z.object({
  id: z.string(),
  customName: z.string().optional().nullable(),
  status: z.string(),
  isEquipped: z.boolean().optional().default(false),
  item: z
    .object({
      id: z.string().optional(),
      name: z.string().optional().nullable(),
      type: z.string().optional().nullable(),
      imageKey: z.string().optional().nullable(),
      weight: z.number().optional().nullable(),
    })
    .nullable(),
});

const vehicleMountedItemSchema = z.object({
  id: z.string(),
  vehicleCharacterId: z.string(),
  itemCharacterId: z.string(),
  mountSlot: z.string().optional().nullable(),
  itemCharacter: vehicleMountedItemSummarySchema.nullable(),
});
export type VehicleMountedItem = z.infer<typeof vehicleMountedItemSchema>;

const vehicleCargoItemSchema = z.object({
  itemCharacterId: z.string(),
  quantity: z.number().int(),
  customName: z.string().optional().nullable(),
  status: z.string(),
  weightKg: z.number(),
  item: z
    .object({
      id: z.string().optional(),
      name: z.string().optional().nullable(),
      type: z.string().optional().nullable(),
      imageKey: z.string().optional().nullable(),
      weight: z.number().optional().nullable(),
    })
    .nullable(),
});
export type VehicleCargoItem = z.infer<typeof vehicleCargoItemSchema>;

const vehiclePassengerSchema = z.object({
  characterId: z.string(),
  name: z.string(),
  surname: z.string().optional().nullable(),
});
export type VehiclePassenger = z.infer<typeof vehiclePassengerSchema>;

export const vehicleCharacterSchema = z.object({
  id: z.string(),
  characterId: z.string(),
  sourceType: vehicleSourceTypeSchema,
  vehicleId: z.string(),
  customName: z.string().optional().nullable(),
  currentHp: z.number().int(),
  maxHpBonus: z.number().int().default(0),
  isBeyondRepair: z.boolean().default(false),
  parkedAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  passengerCharacterIds: z.array(z.string()).optional().default([]),
  vehicle: resolvedVehicleSchema.nullable(),
  effectiveMaxHp: z.number().int().nullable(),
  derivedStatus: vehicleDerivedStatusSchema,
  canBeRidden: z.boolean(),
  mountedItems: z.array(vehicleMountedItemSchema).optional().default([]),
  cargoItems: z.array(vehicleCargoItemSchema).optional().default([]),
  cargoWeightKg: z.number().optional().default(0),
  passengers: z.array(vehiclePassengerSchema).optional().default([]),
  occupantCount: z.number().int().optional().default(0),
  driverPresent: z.boolean().optional().default(false),
});
export type VehicleCharacter = z.infer<typeof vehicleCharacterSchema>;

export type ResolvedVehicle = z.infer<typeof resolvedVehicleSchema>;

export const attachVehicleMountedItemSchema = z.object({
  itemCharacterId: z.string().min(1, "Item is required"),
  mountSlot: z.string().trim().min(1).optional().nullable(),
});

export const stowVehicleCargoSchema = z.object({
  itemCharacterId: z.string().min(1, "Item is required"),
});

export const addVehiclePassengerSchema = z.object({
  passengerCharacterId: z.string().min(1, "Passenger is required"),
});

export const addVehicleToCharacterSchema = z.object({
  sourceType: vehicleSourceTypeSchema,
  vehicleId: z.string(),
});
export type AddVehicleToCharacter = z.infer<typeof addVehicleToCharacterSchema>;

export const vehicleCharacterPatchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("adjustHp"),
    amount: z.number().int(),
  }),
  z.object({
    action: z.literal("setHp"),
    currentHp: z.number().int(),
  }),
  z.object({
    action: z.literal("setCustomName"),
    customName: z.string().nullable(),
  }),
  z.object({
    action: z.literal("setParkedAt"),
    parkedAt: z.string().trim().min(1, "Parked location is required"),
  }),
  z.object({
    action: z.literal("setNotes"),
    notes: z.string().nullable(),
  }),
  z.object({
    action: z.literal("setMaxHpBonus"),
    maxHpBonus: z.number().int(),
  }),
  z.object({
    action: z.literal("setBeyondRepair"),
    isBeyondRepair: z.boolean(),
  }),
]);
export type VehicleCharacterPatch = z.infer<typeof vehicleCharacterPatchSchema>;

export const vehicleTransferSchema = z.object({
  toCharacterId: z.string().min(1, "Recipient is required"),
});
export type VehicleTransfer = z.infer<typeof vehicleTransferSchema>;

export const giveVehicleSchema = addVehicleToCharacterSchema.and(
  z.object({
    characterId: z.string().min(1, "Character is required"),
  })
);

export const activeVehiclePatchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("mount"),
    vehicleCharacterId: z.string().min(1, "Vehicle is required"),
  }),
  z.object({
    action: z.literal("dismount"),
    parkedAt: z.string().trim().min(1, "Parked location is required"),
  }),
]);
export type ActiveVehiclePatch = z.infer<typeof activeVehiclePatchSchema>;
