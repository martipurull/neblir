import type {
  CustomItem,
  Item,
  ItemAttributePath,
  ItemGeneralSkill,
  Prisma,
  UniqueItem,
} from "@prisma/client";
import type { z } from "zod";
import {
  ATTRIBUTE_PATH_API_TO_PRISMA,
  GENERAL_SKILL_API_TO_PRISMA,
  PRISMA_TO_ATTRIBUTE_PATH_API,
  PRISMA_TO_GENERAL_SKILL_API,
} from "@/app/lib/itemModifierEnums";
import type {
  LevelUpAttributePath,
  LevelUpGeneralSkill,
} from "@/app/lib/levelUpPaths";
import type {
  CustomItemUpdate,
  Item as ParsedItem,
  UniqueItemUpdate,
} from "@/app/lib/types/item";
import type { itemUpdateSchema } from "@/app/lib/types/item";

type ItemUpdateParsed = z.infer<typeof itemUpdateSchema>;

export function mapParsedItemToPrismaCreate(
  data: ParsedItem
): Prisma.ItemCreateInput {
  const { modifiesAttribute, modifiesSkill, ...rest } = data;
  return {
    ...rest,
    modifiesAttribute:
      modifiesAttribute == null
        ? undefined
        : ATTRIBUTE_PATH_API_TO_PRISMA[modifiesAttribute],
    modifiesSkill:
      modifiesSkill == null
        ? undefined
        : GENERAL_SKILL_API_TO_PRISMA[modifiesSkill],
  };
}

export function mapItemUpdateParsedToPrisma(
  data: ItemUpdateParsed
): Prisma.ItemUpdateInput {
  const out: Prisma.ItemUpdateInput = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (key === "modifiesAttribute") {
      out.modifiesAttribute =
        value == null
          ? null
          : ATTRIBUTE_PATH_API_TO_PRISMA[value as LevelUpAttributePath];
    } else if (key === "modifiesSkill") {
      out.modifiesSkill =
        value == null
          ? null
          : GENERAL_SKILL_API_TO_PRISMA[value as LevelUpGeneralSkill];
    } else {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

export function mapPrismaItemToApi(row: Item) {
  return {
    ...row,
    modifiesAttribute:
      row.modifiesAttribute == null
        ? null
        : PRISMA_TO_ATTRIBUTE_PATH_API[row.modifiesAttribute],
    modifiesSkill:
      row.modifiesSkill == null
        ? null
        : PRISMA_TO_GENERAL_SKILL_API[row.modifiesSkill],
  };
}

export function mapPrismaCustomItemToApi(row: CustomItem) {
  return {
    ...row,
    modifiesAttribute:
      row.modifiesAttribute == null
        ? null
        : PRISMA_TO_ATTRIBUTE_PATH_API[row.modifiesAttribute],
    modifiesSkill:
      row.modifiesSkill == null
        ? null
        : PRISMA_TO_GENERAL_SKILL_API[row.modifiesSkill],
  };
}

export function mapPrismaUniqueItemToApi(row: UniqueItem) {
  return {
    ...row,
    modifiesAttributeOverride:
      row.modifiesAttributeOverride == null
        ? null
        : PRISMA_TO_ATTRIBUTE_PATH_API[row.modifiesAttributeOverride],
    modifiesSkillOverride:
      row.modifiesSkillOverride == null
        ? null
        : PRISMA_TO_GENERAL_SKILL_API[row.modifiesSkillOverride],
  };
}

/** Map optional modifier fields from API body into Prisma shape (create / update). */
export function mapApiModifiersToPrismaFields(partial: {
  modifiesAttribute?: LevelUpAttributePath | null;
  modifiesSkill?: LevelUpGeneralSkill | null;
  attributeMod?: number | null;
  skillMod?: number | null;
}): {
  modifiesAttribute?: ItemAttributePath | null;
  modifiesSkill?: ItemGeneralSkill | null;
  attributeMod?: number | null;
  skillMod?: number | null;
} {
  const out: {
    modifiesAttribute?: ItemAttributePath | null;
    modifiesSkill?: ItemGeneralSkill | null;
    attributeMod?: number | null;
    skillMod?: number | null;
  } = {};
  if (partial.modifiesAttribute !== undefined) {
    out.modifiesAttribute =
      partial.modifiesAttribute == null
        ? null
        : ATTRIBUTE_PATH_API_TO_PRISMA[partial.modifiesAttribute];
  }
  if (partial.modifiesSkill !== undefined) {
    out.modifiesSkill =
      partial.modifiesSkill == null
        ? null
        : GENERAL_SKILL_API_TO_PRISMA[partial.modifiesSkill];
  }
  if (partial.attributeMod !== undefined) {
    out.attributeMod = partial.attributeMod;
  }
  if (partial.skillMod !== undefined) {
    out.skillMod = partial.skillMod;
  }
  return out;
}

export function mapCustomItemUpdateZodToPrisma(
  data: CustomItemUpdate
): Prisma.CustomItemUpdateInput {
  const { modifiesAttribute, modifiesSkill, attributeMod, skillMod, ...rest } =
    data;
  return {
    ...rest,
    ...mapApiModifiersToPrismaFields({
      modifiesAttribute,
      modifiesSkill,
      attributeMod,
      skillMod,
    }),
  };
}

export function mapUniqueItemUpdateZodToPrisma(
  data: UniqueItemUpdate
): Prisma.UniqueItemUpdateInput {
  const {
    modifiesAttributeOverride,
    modifiesSkillOverride,
    attributeModOverride,
    skillModOverride,
    ...rest
  } = data;
  const mod = mapApiModifiersToPrismaFields({
    modifiesAttribute: modifiesAttributeOverride,
    modifiesSkill: modifiesSkillOverride,
    attributeMod: attributeModOverride,
    skillMod: skillModOverride,
  });
  return {
    ...rest,
    ...(mod.modifiesAttribute !== undefined && {
      modifiesAttributeOverride: mod.modifiesAttribute,
    }),
    ...(mod.modifiesSkill !== undefined && {
      modifiesSkillOverride: mod.modifiesSkill,
    }),
    ...(mod.attributeMod !== undefined && {
      attributeModOverride: mod.attributeMod,
    }),
    ...(mod.skillMod !== undefined && {
      skillModOverride: mod.skillMod,
    }),
  };
}
