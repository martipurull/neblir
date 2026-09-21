import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import { CatalogueImageCopyError } from "@/app/lib/officialCatalogueImage";
import { getGame } from "@/app/lib/prisma/game";
import { runCataloguePromotion } from "@/app/lib/runCataloguePromotion";
import { cataloguePromotionBodySchema } from "@/app/lib/types/cataloguePromotion";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../shared/errors";
import { responseIfOfficialNameUniqueConstraint } from "../../../shared/officialNameConflict";
import { errorResponse } from "../../../shared/responses";

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

    const result = await runCataloguePromotion(gameId, parsedBody.data);
    if (result.ok) {
      return NextResponse.json(
        { catalogueDomain: result.catalogueDomain, official: result.official },
        { status: 201 }
      );
    }
    return errorResponse(result.message, result.status, result.details);
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
