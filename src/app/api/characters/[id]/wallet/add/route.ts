import { AuthNextRequest } from "@/app/lib/types/api";
import { walletAdjustmentSchema } from "@/app/lib/types/item";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import { addCharacterCurrency } from "@/app/lib/prisma/characterCurrency";

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/wallet/add",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/wallet/add",
        message: "Invalid character ID",
        characterId: id,
      });
      return errorResponse("Invalid character ID", 400);
    }
    if (!(await characterBelongsToUser(id, request.auth.user.id))) {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/wallet/add",
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
        route: "/api/characters/[id]/wallet/add",
        message: "Error parsing wallet add request",
        details: error,
      });
      return errorResponse(
        "Error parsing wallet add request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const updatedWallet = await addCharacterCurrency(
      id,
      parsedBody.currencyName,
      parsedBody.amount
    );

    return NextResponse.json(updatedWallet, { status: 200 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/characters/[id]/wallet/add",
      message: "Error adding currency",
      error,
    });
    return errorResponse("Error adding currency", 500, serializeError(error));
  }
});
