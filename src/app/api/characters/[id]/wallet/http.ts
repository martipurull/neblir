import {
  ExchangeRuleError,
  WalletRuleError,
} from "@/app/lib/prisma/characterCurrency";
import { userHasPlayControl } from "@/app/lib/prisma/gameCharacter";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { errorResponse } from "../../../shared/responses";

export async function refuseWithoutWalletPlayControl(
  request: AuthNextRequest,
  characterId: string | undefined,
  method: string,
  route: string
) {
  if (!request.auth?.user) {
    logger.error({
      method,
      route,
      message: "Unauthorised access attempt",
    });
    return errorResponse("Unauthorised", 401);
  }

  if (!characterId || typeof characterId !== "string") {
    logger.error({
      method,
      route,
      message: "Invalid character ID",
      characterId,
    });
    return errorResponse("Invalid character ID", 400);
  }

  if (!(await userHasPlayControl(characterId, request.auth.user.id))) {
    logger.error({
      method,
      route,
      message: "Character does not belong to user",
      characterId,
    });
    return errorResponse("This is not one of your characters.", 403);
  }

  return null;
}

export function responseForWalletRule(error: unknown) {
  if (!(error instanceof WalletRuleError)) return null;
  if (error.code === "UNKNOWN_CURRENCY") {
    return errorResponse("Unknown currency", 400);
  }
  return errorResponse("Insufficient funds", 400);
}

export function responseForExchangeRule(error: unknown) {
  if (!(error instanceof ExchangeRuleError)) return null;
  const { refusal } = error;
  if (refusal.code === "UNKNOWN_CURRENCY") {
    return errorResponse("Unknown currency", 400);
  }
  if (refusal.code === "INSUFFICIENT_FUNDS") {
    return errorResponse("Insufficient funds", 400);
  }
  if (refusal.code === "SAME_CURRENCY") {
    return errorResponse("A currency cannot be exchanged into itself", 400);
  }
  return NextResponse.json(
    {
      message: `The smallest amount of ${refusal.sourceName} that yields one ${refusal.destinationName} is ${refusal.minimumSourceAmount}.`,
      minimumSourceAmount: refusal.minimumSourceAmount,
      sourceName: refusal.sourceName,
      destinationName: refusal.destinationName,
    },
    { status: 400 }
  );
}
