import type { AuthNextRequest } from "@/app/lib/types/api";
import { walletExchangeSchema } from "@/app/lib/types/item";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { logger } from "@/logger";
import { serializeError } from "../../../../../shared/errors";
import { errorResponse } from "../../../../../shared/responses";
import { quoteCharacterCurrencyExchange } from "@/app/lib/prisma/characterCurrency";
import {
  refuseWithoutWalletPlayControl,
  responseForExchangeRule,
} from "../../http";

const route = "/api/characters/[id]/wallet/exchange/quote";

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
      walletExchangeSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "POST",
        route,
        message: "Error parsing wallet exchange request",
        details: error,
      });
      return errorResponse(
        "Error parsing wallet exchange request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    try {
      const quote = await quoteCharacterCurrencyExchange(
        id,
        parsedBody.sourceCurrencyId,
        parsedBody.destinationCurrencyId,
        parsedBody.amount
      );
      return NextResponse.json(quote, { status: 200 });
    } catch (ruleError) {
      const ruled = responseForExchangeRule(ruleError);
      if (ruled) return ruled;
      throw ruleError;
    }
  } catch (error) {
    logger.error({
      method: "POST",
      route,
      message: "Error quoting currency exchange",
      error,
    });
    return errorResponse(
      "Error quoting currency exchange",
      500,
      serializeError(error)
    );
  }
});
