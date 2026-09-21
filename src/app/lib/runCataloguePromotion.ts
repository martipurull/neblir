import {
  customImageKey,
  customTemplateName,
  officialEnemyFromCustom,
  officialItemFromCustom,
  officialVehicleFromCustom,
  type OfficialFieldMapResult,
} from "@/app/lib/cataloguePromotion";
import {
  copyImageToOfficialCatalogue,
  deleteUnreferencedCatalogueImageIfUnused,
} from "@/app/lib/officialCatalogueImage";
import { officialNameConflicts } from "@/app/lib/officialName";
import { getCustomItem } from "@/app/lib/prisma/customItem";
import { getCustomEnemy } from "@/app/lib/prisma/customEnemy";
import { createEnemy, getEnemies } from "@/app/lib/prisma/enemy";
import { getEnemyInstance } from "@/app/lib/prisma/enemyInstance";
import { createItem, getItems } from "@/app/lib/prisma/item";
import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import { getUniqueItem } from "@/app/lib/prisma/uniqueItem";
import { getUniqueVehicle } from "@/app/lib/prisma/uniqueVehicle";
import {
  createVehicle,
  getCustomVehicle,
  getVehicles,
} from "@/app/lib/prisma/vehicle";
import type {
  CataloguePromotionBody,
  PromotableCatalogueDomain,
} from "@/app/lib/types/cataloguePromotion";
import type { CustomItemResponse } from "@/app/lib/types/item";
import type { CustomVehicleResponse } from "@/app/lib/types/vehicle";

const NOT_CUSTOM_TEMPLATE_MESSAGE = "Only Custom templates can be promoted";
const OFFICIAL_NAME_TAKEN_MESSAGE = "This Official name is already taken";

type CataloguePromotionFailure = {
  ok: false;
  status: 400 | 404 | 409;
  message: string;
  details?: string;
};

export type CataloguePromotionResult =
  | {
      ok: true;
      catalogueDomain: PromotableCatalogueDomain;
      official: unknown;
    }
  | CataloguePromotionFailure;

type OfficialNamedRow = { id: string; name: string };

function officialNamedRows(
  existing: ReadonlyArray<{ id?: string | null; name?: string | null }>
): OfficialNamedRow[] {
  const rows: OfficialNamedRow[] = [];
  for (const row of existing) {
    if (typeof row.id === "string" && typeof row.name === "string") {
      rows.push({ id: row.id, name: row.name });
    }
  }
  return rows;
}

type LoadedCustom<T> = { custom: T } | CataloguePromotionFailure;

function isLoadFailure<T>(
  loaded: LoadedCustom<T>
): loaded is CataloguePromotionFailure {
  return "ok" in loaded && loaded.ok === false;
}

async function loadCustomTemplate<
  T extends { gameId?: string | null },
>(options: {
  gameId: string;
  loadCustom: () => Promise<T | null>;
  loadNonTemplate: () => Promise<unknown>;
  notFoundMessage: string;
}): Promise<LoadedCustom<T>> {
  const custom = await options.loadCustom();
  if (custom && custom.gameId === options.gameId) {
    return { custom };
  }
  if (await options.loadNonTemplate()) {
    return {
      ok: false,
      status: 400,
      message: NOT_CUSTOM_TEMPLATE_MESSAGE,
    };
  }
  return { ok: false, status: 404, message: options.notFoundMessage };
}

async function createOfficialAfterImageCopy<T>(options: {
  catalogueDomain: PromotableCatalogueDomain;
  sourceImageKey: string | null;
  create: (imageKey: string | null) => Promise<T>;
}): Promise<T> {
  const imageKey = await copyImageToOfficialCatalogue(
    options.sourceImageKey,
    options.catalogueDomain
  );
  try {
    const created = await options.create(imageKey);
    await touchStaffCatalogueDrift([options.catalogueDomain]);
    return created;
  } catch (error) {
    if (imageKey) {
      await deleteUnreferencedCatalogueImageIfUnused(imageKey);
    }
    throw error;
  }
}

async function completeOfficialPromotion<
  TCustom extends {
    name?: string | null;
    imageKey?: string | null;
  },
  TOfficial,
>(options: {
  catalogueDomain: PromotableCatalogueDomain;
  custom: TCustom;
  mapped: OfficialFieldMapResult<TOfficial>;
  listOfficial: () => Promise<
    ReadonlyArray<{ id?: string | null; name?: string | null }>
  >;
  create: (data: TOfficial, imageKey: string | null) => Promise<unknown>;
}): Promise<CataloguePromotionResult> {
  const mapped = options.mapped;
  if (!mapped.ok) {
    return {
      ok: false,
      status: 400,
      message: "Official required fields are missing",
      details: mapped.message,
    };
  }

  const existing = await options.listOfficial();
  if (
    officialNameConflicts(
      officialNamedRows(existing),
      customTemplateName(options.custom)
    )
  ) {
    return { ok: false, status: 409, message: OFFICIAL_NAME_TAKEN_MESSAGE };
  }

  const official = await createOfficialAfterImageCopy({
    catalogueDomain: options.catalogueDomain,
    sourceImageKey: customImageKey(options.custom),
    create: (imageKey) => options.create(mapped.data, imageKey),
  });
  return {
    ok: true,
    catalogueDomain: options.catalogueDomain,
    official,
  };
}

export async function runCataloguePromotion(
  gameId: string,
  body: CataloguePromotionBody
): Promise<CataloguePromotionResult> {
  if (body.catalogueDomain === "items") {
    const loaded = await loadCustomTemplate({
      gameId,
      loadCustom: () => getCustomItem(body.customId),
      loadNonTemplate: () => getUniqueItem(body.customId),
      notFoundMessage: "Custom item not found",
    });
    if (isLoadFailure(loaded)) return loaded;
    return completeOfficialPromotion({
      catalogueDomain: "items",
      custom: loaded.custom,
      mapped: officialItemFromCustom(loaded.custom as CustomItemResponse, body),
      listOfficial: getItems,
      create: (data, imageKey) =>
        createItem(
          { ...data, ...(imageKey ? { imageKey } : {}) },
          { officialCatalogueWrite: true }
        ),
    });
  }

  if (body.catalogueDomain === "vehicles") {
    const loaded = await loadCustomTemplate({
      gameId,
      loadCustom: () => getCustomVehicle(body.customId),
      loadNonTemplate: () => getUniqueVehicle(body.customId),
      notFoundMessage: "Custom vehicle not found",
    });
    if (isLoadFailure(loaded)) return loaded;
    return completeOfficialPromotion({
      catalogueDomain: "vehicles",
      custom: loaded.custom,
      mapped: officialVehicleFromCustom(
        loaded.custom as CustomVehicleResponse,
        body
      ),
      listOfficial: getVehicles,
      create: (data, imageKey) =>
        createVehicle({ ...data, imageKey }, { officialCatalogueWrite: true }),
    });
  }

  const loaded = await loadCustomTemplate({
    gameId,
    loadCustom: () => getCustomEnemy(body.customId),
    loadNonTemplate: () => getEnemyInstance(body.customId),
    notFoundMessage: "Custom enemy not found",
  });
  if (isLoadFailure(loaded)) return loaded;
  return completeOfficialPromotion({
    catalogueDomain: "enemies",
    custom: loaded.custom,
    mapped: officialEnemyFromCustom(loaded.custom),
    listOfficial: getEnemies,
    create: (data, imageKey) =>
      createEnemy({
        ...data,
        imageKey: imageKey ?? undefined,
        protectedFromOfficialImport: true,
      }),
  });
}
