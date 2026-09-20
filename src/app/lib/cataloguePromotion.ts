import { enemyCreateSchema } from "@/app/lib/types/enemy";
import { itemSchema, type Item, type ItemDamage } from "@/app/lib/types/item";
import { vehicleSchema, type Vehicle } from "@/app/lib/types/vehicle";
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

function omitCustomOnlyFields(
  row: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (DROP_CUSTOM_KEYS.has(key) || value === null) continue;
    out[key] = value;
  }
  return out;
}

function overlayOptionalText(
  bodyValue: string | undefined,
  customValue: unknown
): string | undefined {
  if (bodyValue !== undefined) {
    return bodyValue.trim() === "" ? undefined : bodyValue;
  }
  if (typeof customValue !== "string") return undefined;
  return customValue.trim() === "" ? undefined : customValue;
}

function overlayOptionalNumber(
  bodyValue: number | undefined,
  customValue: unknown
): number | undefined {
  if (bodyValue !== undefined) return bodyValue;
  return typeof customValue === "number" ? customValue : undefined;
}

function overlayOptionalDamage(
  bodyValue: ItemDamage | undefined,
  customValue: unknown
): unknown {
  if (bodyValue !== undefined) return bodyValue;
  return customValue;
}

export function officialItemFromCustom(
  custom: Record<string, unknown>,
  body: Extract<CataloguePromotionBody, { catalogueDomain: "items" }>
): { ok: true; data: Item } | { ok: false; message: string } {
  const candidate = {
    ...omitCustomOnlyFields(custom),
    accessType: body.accessType,
    confCost: overlayOptionalNumber(body.confCost, custom.confCost),
    description: overlayOptionalText(body.description, custom.description),
    usage: overlayOptionalText(body.usage, custom.usage),
    damage: overlayOptionalDamage(body.damage, custom.damage),
  };
  const parsed = itemSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.map((issue) => issue.message).join(". "),
    };
  }
  return { ok: true, data: parsed.data };
}

export function officialVehicleFromCustom(
  custom: Record<string, unknown>,
  body: Extract<CataloguePromotionBody, { catalogueDomain: "vehicles" }>
): { ok: true; data: Vehicle } | { ok: false; message: string } {
  const candidate = {
    ...omitCustomOnlyFields(custom),
    accessType: body.accessType,
    confCost: overlayOptionalNumber(body.confCost, custom.confCost),
    description: overlayOptionalText(body.description, custom.description),
  };
  const parsed = vehicleSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.map((issue) => issue.message).join(". "),
    };
  }
  return { ok: true, data: parsed.data };
}

export function officialEnemyFromCustom(
  custom: Record<string, unknown>
): { ok: true; data: OfficialEnemyCreate } | { ok: false; message: string } {
  const parsed = enemyCreateSchema.safeParse(omitCustomOnlyFields(custom));
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.map((issue) => issue.message).join(". "),
    };
  }
  return { ok: true, data: parsed.data };
}

export function customTemplateName(custom: Record<string, unknown>): string {
  return typeof custom.name === "string" ? custom.name : "";
}
