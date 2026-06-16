import { z } from "zod";

/** Stable ids used by character section slides (`CharacterSectionSlide.id`). */
export const CHARACTER_SECTION_IDS = [
  "attributes",
  "skills",
  "combat",
  "general",
  "health",
  "paths",
  "features",
  "inventory",
  "wallet",
  "notes",
] as const;

export type CharacterSectionId = (typeof CHARACTER_SECTION_IDS)[number];

/** Default section order on the character page (matches current build order). */
export const DEFAULT_CHARACTER_SECTION_ORDER: readonly CharacterSectionId[] = [
  "attributes",
  "skills",
  "combat",
  "general",
  "health",
  "paths",
  "features",
  "inventory",
  "wallet",
  "notes",
];

/** Display labels for settings UI and reorder lists. */
export const CHARACTER_SECTION_LABELS: Record<CharacterSectionId, string> = {
  attributes: "Attributes",
  skills: "Skills",
  combat: "Combat",
  general: "General Information",
  health: "Health",
  paths: "Paths",
  features: "Features",
  inventory: "Inventory",
  wallet: "Wallet",
  notes: "Notes",
};

const characterSectionIdSet = new Set<string>(CHARACTER_SECTION_IDS);

export function isCharacterSectionId(
  value: string
): value is CharacterSectionId {
  return characterSectionIdSet.has(value);
}

const characterSectionIdSchema = z.enum(CHARACTER_SECTION_IDS);

export const characterSectionOrderSchema = z
  .array(characterSectionIdSchema)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "Duplicate section ids are not allowed",
  })
  .nullish();

export type CharacterSectionOrder = NonNullable<
  z.infer<typeof characterSectionOrderSchema>
>;

/** API: empty/missing stored order is exposed as null (use default order). */
export function toApiCharacterSectionOrder(
  order: readonly string[] | null | undefined
): CharacterSectionOrder | null {
  if (!order?.length) return null;
  return order as CharacterSectionOrder;
}

/** DB: null or empty API payload clears saved order. */
export function toDbCharacterSectionOrder(
  order: CharacterSectionOrder | null | undefined
): CharacterSectionId[] | undefined {
  if (order === undefined) return undefined;
  if (order === null || order.length === 0) return [];
  return order;
}
