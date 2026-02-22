import { createUniqueItem } from "@/app/lib/prisma/uniqueItem";
import { uniqueItemCreateSchema } from "@/app/lib/types/item";
import { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../shared/errors";
import { errorResponse } from "../shared/responses";

export const POST = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/unique-items",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      uniqueItemCreateSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "POST",
        route: "/api/unique-items",
        message: "Error parsing unique item creation request",
        details: error,
      });
      return errorResponse(
        "Error parsing unique item creation request",
        400,
        error.issues.map((i) => i.message).join(". ")
      );
    }

    const item = await createUniqueItem({
      sourceType: parsedBody.sourceType,
      itemId: parsedBody.itemId,
      attackRollOverride: parsedBody.attackRollOverride ?? [],
      attackBonusOverride: parsedBody.attackBonusOverride ?? undefined,
      confCostOverride: parsedBody.confCostOverride ?? undefined,
      costInfoOverride: parsedBody.costInfoOverride ?? undefined,
      damageOverride: parsedBody.damageOverride ?? undefined,
      descriptionOverride: parsedBody.descriptionOverride ?? undefined,
      imageKeyOverride: parsedBody.imageKeyOverride ?? undefined,
      nameOverride: parsedBody.nameOverride ?? undefined,
      usageOverride: parsedBody.usageOverride ?? undefined,
      weightOverride: parsedBody.weightOverride ?? undefined,
      notesOverride: parsedBody.notesOverride ?? undefined,
      specialTag: parsedBody.specialTag ?? undefined,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/unique-items",
      message: "Error creating unique item",
      error,
    });
    return errorResponse(
      "Error creating unique item",
      500,
      serializeError(error)
    );
  }
});
