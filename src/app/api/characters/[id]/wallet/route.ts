import type { AuthNextRequest } from "@/app/lib/types/api";
import { walletReplaceSchema } from "@/app/lib/types/item";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { logger } from "@/logger";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";
import {
  listCharacterWallet,
  replaceCharacterWallet,
} from "@/app/lib/prisma/characterCurrency";
import { refuseWithoutWalletPlayControl, responseForWalletRule } from "./http";

const route = "/api/characters/[id]/wallet";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    const { id } = (await params) as { id: string };
    const refused = await refuseWithoutWalletPlayControl(
      request,
      id,
      "GET",
      route
    );
    if (refused) return refused;

    const wallet = await listCharacterWallet(id);
    return NextResponse.json(wallet, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route,
      message: "Error fetching wallet",
      error,
    });
    return errorResponse("Error fetching wallet", 500, serializeError(error));
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    const { id } = (await params) as { id: string };
    const refused = await refuseWithoutWalletPlayControl(
      request,
      id,
      "PATCH",
      route
    );
    if (refused) return refused;

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      walletReplaceSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "PATCH",
        route,
        message: "Error parsing wallet update request",
        details: error,
      });
      return errorResponse(
        "Error parsing wallet update request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    try {
      const updatedWallet = await replaceCharacterWallet(id, parsedBody);
      return NextResponse.json(updatedWallet, { status: 200 });
    } catch (ruleError) {
      const ruled = responseForWalletRule(ruleError);
      if (ruled) return ruled;
      throw ruleError;
    }
  } catch (error) {
    logger.error({
      method: "PATCH",
      route,
      message: "Error updating wallet",
      error,
    });
    return errorResponse("Error updating wallet", 500, serializeError(error));
  }
});
