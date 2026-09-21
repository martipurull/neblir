import type { CustomEnemy } from "@prisma/client";
import { enemyCreateSchema } from "@/app/lib/types/enemy";
import {
  itemSchema,
  type CustomItemResponse,
  type Item,
  type ItemDamage,
} from "@/app/lib/types/item";
import {
  type CustomVehicleResponse,
  type Vehicle,
  vehicleSchema,
} from "@/app/lib/types/vehicle";
import type { CataloguePromotionBody } from "@/app/lib/types/cataloguePromotion";
import type { z } from "zod";

type OfficialEnemyCreate = z.infer<typeof enemyCreateSchema>;

const DROP_CUSTOM_KEYS = new Set([
  "id",
  "gameId",
  "membersCanModify",
  "imageKey",
  "enemyInstances",
]);

export type OfficialFieldMapResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

function omitCustomOnlyFields(row: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (DROP_CUSTOM_KEYS.has(key) || value === null) continue;
    out[key] = value;
  }
  return out;
}

function overlayOptionalText(
  bodyValue: string | undefined,
  customValue: string | null | undefined
): string | undefined {
  if (bodyValue !== undefined) {
    return bodyValue.trim() === "" ? undefined : bodyValue;
  }
  if (typeof customValue !== "string") return undefined;
  return customValue.trim() === "" ? undefined : customValue;
}

function overlayOptionalNumber(
  bodyValue: number | undefined,
  customValue: number | null | undefined
): number | undefined {
  if (bodyValue !== undefined) return bodyValue;
  return typeof customValue === "number" ? customValue : undefined;
}

function overlayOptionalDamage(
  bodyValue: ItemDamage | undefined,
  customValue: CustomItemResponse["damage"]
): unknown {
  if (bodyValue !== undefined) return bodyValue;
  return customValue;
}

function parseOfficial<T>(
  parsed: { success: true; data: T } | { success: false; error: z.ZodError }
): OfficialFieldMapResult<T> {
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.map((issue) => issue.message).join(". "),
    };
  }
  return { ok: true, data: parsed.data };
}

export function officialItemFromCustom(
  custom: CustomItemResponse,
  body: Extract<CataloguePromotionBody, { catalogueDomain: "items" }>
): OfficialFieldMapResult<Item> {
  const candidate = {
    ...omitCustomOnlyFields(custom),
    accessType: body.accessType,
    confCost: overlayOptionalNumber(body.confCost, custom.confCost),
    description: overlayOptionalText(body.description, custom.description),
    usage: overlayOptionalText(body.usage, custom.usage),
    damage: overlayOptionalDamage(body.damage, custom.damage),
  };
  const parsed = itemSchema.safeParse(candidate);
  const mapped = parseOfficial(parsed);
  if (!mapped.ok) return mapped;
  if (
    mapped.data.type === "WEAPON" &&
    mapped.data.damage.damageType.length === 0
  ) {
    return {
      ok: false,
      message: "Official weapons require a damage type",
    };
  }
  return mapped;
}

export function officialVehicleFromCustom(
  custom: CustomVehicleResponse,
  body: Extract<CataloguePromotionBody, { catalogueDomain: "vehicles" }>
): OfficialFieldMapResult<Vehicle> {
  const candidate = {
    ...omitCustomOnlyFields(custom),
    accessType: body.accessType,
    confCost: overlayOptionalNumber(body.confCost, custom.confCost),
    description: overlayOptionalText(body.description, custom.description),
  };
  return parseOfficial(vehicleSchema.safeParse(candidate));
}

export function officialEnemyFromCustom(
  custom: CustomEnemy
): OfficialFieldMapResult<OfficialEnemyCreate> {
  return parseOfficial(
    enemyCreateSchema.safeParse(omitCustomOnlyFields(custom))
  );
}

export function customTemplateName(custom: { name?: string | null }): string {
  return typeof custom.name === "string" ? custom.name : "";
}

export function customImageKey(custom: {
  imageKey?: string | null;
}): string | null {
  return typeof custom.imageKey === "string" ? custom.imageKey : null;
}
