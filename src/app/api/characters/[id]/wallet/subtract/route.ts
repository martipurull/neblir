import { AuthNextRequest } from "@/app/lib/types/api";
import { walletAdjustmentSchema } from "@/app/lib/types/item";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import { subtractCharacterCurrency } from "@/app/lib/prisma/characterCurrency";

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/wallet/subtract",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/wallet/subtract",
        message: "Invalid character ID",
        characterId: id,
      });
      return errorResponse("Invalid character ID", 400);
    }
    if (!(await characterBelongsToUser(id, request.auth.user.id))) {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/wallet/subtract",
        message: "Character does not belong to user",
        characterId: id,
      });
      return errorResponse("This is not one of your characters.", 403);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      walletAdjustmentSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/wallet/subtract",
        message: "Error parsing wallet subtract request",
        details: error,
      });
      return errorResponse(
        "Error parsing wallet subtract request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    let updatedWallet;
    try {
      updatedWallet = await subtractCharacterCurrency(
        id,
        parsedBody.currencyName,
        parsedBody.amount
      );
    } catch (error) {
      if (error instanceof Error && error.message === "CURRENCY_NOT_FOUND") {
        return errorResponse(
          `Currency '${parsedBody.currencyName}' not found in wallet`,
          400
        );
      }
      if (error instanceof Error && error.message === "INSUFFICIENT_FUNDS") {
        return errorResponse(
          `Insufficient funds in '${parsedBody.currencyName}'`,
          400
        );
      }
      throw error;
    }

    return NextResponse.json(updatedWallet, { status: 200 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/characters/[id]/wallet/subtract",
      message: "Error subtracting currency",
      error,
    });
    return errorResponse(
      "Error subtracting currency",
      500,
      serializeError(error)
    );
  }
});
