import type { AuthNextRequest } from "@/app/lib/types/api";
import { walletAdjustmentSchema } from "@/app/lib/types/item";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { logger } from "@/logger";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";
import { subtractCharacterCurrency } from "@/app/lib/prisma/characterCurrency";
import { refuseWithoutWalletPlayControl, responseForWalletRule } from "../http";

const route = "/api/characters/[id]/wallet/subtract";

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    const { id } = (await params) as { id: string };
    const refused = await refuseWithoutWalletPlayControl(
      request,
      id,
      "POST",
      route
    );
    if (refused) return refused;

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      walletAdjustmentSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "POST",
        route,
        message: "Error parsing wallet subtract request",
        details: error,
      });
      return errorResponse(
        "Error parsing wallet subtract request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    try {
      const updatedWallet = await subtractCharacterCurrency(
        id,
        parsedBody.currencyId,
        parsedBody.amount
      );
      return NextResponse.json(updatedWallet, { status: 200 });
    } catch (ruleError) {
      const ruled = responseForWalletRule(ruleError);
      if (ruled) return ruled;
      throw ruleError;
    }
  } catch (error) {
    logger.error({
      method: "POST",
      route,
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
