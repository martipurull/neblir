import { itemDamageSchema } from "@/app/lib/types/item";
import { z } from "zod";

const accessTypeSchema = z.enum(["PLAYER", "GAME_MASTER"]);

const promotionExtrasSchema = z.object({
  confCost: z.number().optional(),
  description: z.string().optional(),
  usage: z.string().optional(),
});

export const cataloguePromotionBodySchema = z.discriminatedUnion(
  "catalogueDomain",
  [
    promotionExtrasSchema.extend({
      catalogueDomain: z.literal("items"),
      customId: z.string().min(1),
      accessType: accessTypeSchema,
      damage: itemDamageSchema.optional(),
    }),
    promotionExtrasSchema.omit({ usage: true }).extend({
      catalogueDomain: z.literal("vehicles"),
      customId: z.string().min(1),
      accessType: accessTypeSchema,
    }),
    z.object({
      catalogueDomain: z.literal("enemies"),
      customId: z.string().min(1),
    }),
  ]
);

export type CataloguePromotionBody = z.infer<
  typeof cataloguePromotionBodySchema
>;

export type PromotableCatalogueDomain =
  CataloguePromotionBody["catalogueDomain"];

export function officialCatalogueEditPath(
  catalogueDomain: PromotableCatalogueDomain,
  officialId: string
): string {
  const segment =
    catalogueDomain === "items"
      ? "items"
      : catalogueDomain === "vehicles"
        ? "vehicles"
        : "enemies";
  return `/home/super-admin/${segment}/${encodeURIComponent(officialId)}/edit`;
}
