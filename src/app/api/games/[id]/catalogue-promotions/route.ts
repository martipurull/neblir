import {
  officialEnemyFromCustom,
  officialItemFromCustom,
  officialVehicleFromCustom,
  customTemplateName,
} from "@/app/lib/cataloguePromotion";
import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import {
  CatalogueImageCopyError,
  copyImageToOfficialCatalogue,
  deleteUnreferencedCatalogueImageIfUnused,
} from "@/app/lib/officialCatalogueImage";
import { getCustomItem } from "@/app/lib/prisma/customItem";
import { getCustomEnemy } from "@/app/lib/prisma/customEnemy";
import { createEnemy, getEnemies } from "@/app/lib/prisma/enemy";
import { getEnemyInstance } from "@/app/lib/prisma/enemyInstance";
import { getGame } from "@/app/lib/prisma/game";
import { createItem, getItems } from "@/app/lib/prisma/item";
import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import { getUniqueItem } from "@/app/lib/prisma/uniqueItem";
import { getUniqueVehicle } from "@/app/lib/prisma/uniqueVehicle";
import {
  createVehicle,
  getCustomVehicle,
  getVehicles,
} from "@/app/lib/prisma/vehicle";
import type { AuthNextRequest } from "@/app/lib/types/api";
import {
  cataloguePromotionBodySchema,
  type PromotableCatalogueDomain,
} from "@/app/lib/types/cataloguePromotion";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../shared/errors";
import {
  responseIfOfficialNameTaken,
  responseIfOfficialNameUniqueConstraint,
} from "../../../shared/officialNameConflict";
import { errorResponse } from "../../../shared/responses";

const NOT_CUSTOM_TEMPLATE_MESSAGE = "Only Custom templates can be promoted";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function belongsToGame(
  custom: Record<string, unknown>,
  gameId: string
): boolean {
  return custom.gameId === gameId;
}

function customImageKey(custom: Record<string, unknown>): string | null {
  return typeof custom.imageKey === "string" ? custom.imageKey : null;
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

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    if (!(await userIsSuperAdmin(request.auth.user.id))) {
      return errorResponse("Forbidden", 403);
    }

    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== request.auth.user.id) {
      return errorResponse("Forbidden", 403);
    }

    const parsedBody = cataloguePromotionBodySchema.safeParse(
      await request.json()
    );
    if (!parsedBody.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsedBody.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const body = parsedBody.data;

    if (body.catalogueDomain === "items") {
      const custom = asRecord(await getCustomItem(body.customId));
      if (!custom || !belongsToGame(custom, gameId)) {
        const unique = await getUniqueItem(body.customId);
        if (unique) {
          return errorResponse(NOT_CUSTOM_TEMPLATE_MESSAGE, 400);
        }
        return errorResponse("Custom item not found", 404);
      }

      const official = officialItemFromCustom(custom, body);
      if (!official.ok) {
        return errorResponse(
          "Official required fields are missing",
          400,
          official.message
        );
      }

      const conflict = responseIfOfficialNameTaken(
        await getItems(),
        customTemplateName(custom)
      );
      if (conflict) return conflict;

      const created = await createOfficialAfterImageCopy({
        catalogueDomain: "items",
        sourceImageKey: customImageKey(custom),
        create: (imageKey) =>
          createItem(
            { ...official.data, ...(imageKey ? { imageKey } : {}) },
            { officialCatalogueWrite: true }
          ),
      });
      return NextResponse.json(
        { catalogueDomain: "items", official: created },
        { status: 201 }
      );
    }

    if (body.catalogueDomain === "vehicles") {
      const custom = asRecord(await getCustomVehicle(body.customId));
      if (!custom || !belongsToGame(custom, gameId)) {
        const unique = await getUniqueVehicle(body.customId);
        if (unique) {
          return errorResponse(NOT_CUSTOM_TEMPLATE_MESSAGE, 400);
        }
        return errorResponse("Custom vehicle not found", 404);
      }

      const official = officialVehicleFromCustom(custom, body);
      if (!official.ok) {
        return errorResponse(
          "Official required fields are missing",
          400,
          official.message
        );
      }

      const conflict = responseIfOfficialNameTaken(
        await getVehicles(),
        customTemplateName(custom)
      );
      if (conflict) return conflict;

      const created = await createOfficialAfterImageCopy({
        catalogueDomain: "vehicles",
        sourceImageKey: customImageKey(custom),
        create: (imageKey) =>
          createVehicle(
            { ...official.data, imageKey },
            { officialCatalogueWrite: true }
          ),
      });
      return NextResponse.json(
        { catalogueDomain: "vehicles", official: created },
        { status: 201 }
      );
    }

    const custom = asRecord(await getCustomEnemy(body.customId));
    if (!custom || !belongsToGame(custom, gameId)) {
      const instance = await getEnemyInstance(body.customId);
      if (instance) {
        return errorResponse(NOT_CUSTOM_TEMPLATE_MESSAGE, 400);
      }
      return errorResponse("Custom enemy not found", 404);
    }

    const official = officialEnemyFromCustom(custom);
    if (!official.ok) {
      return errorResponse(
        "Official required fields are missing",
        400,
        official.message
      );
    }

    const conflict = responseIfOfficialNameTaken(
      await getEnemies(),
      customTemplateName(custom)
    );
    if (conflict) return conflict;

    const created = await createOfficialAfterImageCopy({
      catalogueDomain: "enemies",
      sourceImageKey: customImageKey(custom),
      create: (imageKey) =>
        createEnemy({
          ...official.data,
          imageKey: imageKey ?? undefined,
          protectedFromOfficialImport: true,
        }),
    });
    return NextResponse.json(
      { catalogueDomain: "enemies", official: created },
      { status: 201 }
    );
  } catch (error) {
    const uniqueConflict = responseIfOfficialNameUniqueConstraint(error);
    if (uniqueConflict) return uniqueConflict;
    const copyFailed = error instanceof CatalogueImageCopyError;
    logger.error({
      method: "POST",
      route: "/api/games/[id]/catalogue-promotions",
      message: copyFailed
        ? "Error copying catalogue image during promotion"
        : "Error promoting Custom template",
      error,
    });
    return errorResponse(
      copyFailed
        ? "Failed to copy catalogue image"
        : "Error promoting Custom template",
      copyFailed ? 502 : 500,
      serializeError(error)
    );
  }
});
