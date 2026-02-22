import { AuthNextRequest } from "@/app/lib/types/api";
import { Currency, walletSchema } from "@/app/lib/types/item";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import { replaceCharacterWallet } from "@/app/lib/prisma/characterCurrency";

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/wallet",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/wallet",
        message: "Invalid character ID",
        characterId: id,
      });
      return errorResponse("Invalid character ID", 400);
    }

    if (!(await characterBelongsToUser(id, request.auth.user.id))) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/wallet",
        message: "Character does not belong to user",
        characterId: id,
      });
      return errorResponse("This is not one of your characters.", 403);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } = walletSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/wallet",
        message: "Error parsing wallet update request",
        details: error,
      });
      return errorResponse(
        "Error parsing wallet update request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    if (parsedBody.some((item: Currency) => item.quantity < 0)) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/wallet",
        message: "Invalid quantity for currency",
        details: parsedBody,
      });
      return errorResponse("Invalid quantity for currency", 400);
    }

    const updatedWallet = await replaceCharacterWallet(id, parsedBody);

    return NextResponse.json(updatedWallet, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/characters/[id]/wallet",
      message: "Error updating wallet",
      error,
    });
    return errorResponse("Error updating wallet", 500, serializeError(error));
  }
});
