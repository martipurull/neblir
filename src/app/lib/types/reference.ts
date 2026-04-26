import type { Prisma } from "@prisma/client";
import { z } from "zod";

export const referenceCategorySchema = z.enum([
  "MECHANICS",
  "WORLD",
  "CAMPAIGN_LORE",
]);
export type ReferenceCategory = z.infer<typeof referenceCategorySchema>;

export const referenceAccessSchema = z.enum(["PLAYER", "GAME_MASTER"]);
export type ReferenceAccess = z.infer<typeof referenceAccessSchema>;

const nullableStringSchema = z.string().nullable().optional();
const prismaJsonSchema = z.custom<Prisma.InputJsonValue>((value) => {
  if (value === null || value === undefined) return false;
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
});

function requireGameForCampaignLore<
  T extends { category?: ReferenceCategory; gameId?: string | null },
>(value: T, ctx: z.RefinementCtx) {
  if (value.category === "CAMPAIGN_LORE" && !value.gameId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["gameId"],
      message: "CAMPAIGN_LORE entries require a gameId.",
    });
  }
}

const referenceEntryMutableSchema = z.object({
  category: referenceCategorySchema,
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: nullableStringSchema,
  access: referenceAccessSchema.default("PLAYER"),
  tags: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
  contentJson: prismaJsonSchema.nullable().optional(),
  contentHtml: nullableStringSchema,
  sourceFile: nullableStringSchema,
  gameId: nullableStringSchema,
});

export const referenceEntrySchema = referenceEntryMutableSchema
  .extend({
    id: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .superRefine(requireGameForCampaignLore);

export const referenceEntryCreateSchema = referenceEntryMutableSchema
  .strict()
  .superRefine(requireGameForCampaignLore);

export const referenceEntryUpdateSchema = referenceEntryMutableSchema
  .partial()
  .strict()
  .superRefine(requireGameForCampaignLore);

export const referenceEntryListSchema = z.array(referenceEntrySchema);

export type ReferenceEntry = z.infer<typeof referenceEntrySchema>;
export type ReferenceEntryCreate = z.infer<typeof referenceEntryCreateSchema>;
export type ReferenceEntryUpdate = z.infer<typeof referenceEntryUpdateSchema>;
