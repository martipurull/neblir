import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import { getCurrencies } from "@/app/lib/prisma/currency";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../shared/errors";
import { errorResponse } from "../shared/responses";

const route = "/api/currencies";

type CurrencyListRow = {
  id: string;
  name: string;
  imageKey: string;
  exchangeValue: number;
};

function orderCurrencies<T extends { name: string }>(rows: T[]): T[] {
  const conf: T[] = [];
  const rest: T[] = [];
  for (const row of rows) {
    if (row.name === "CONF") conf.push(row);
    else rest.push(row);
  }
  rest.sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
  return [...conf, ...rest];
}

function toCurrencyListItem(
  row: CurrencyListRow,
  includeExchangeValue: boolean
) {
  const item = {
    id: row.id,
    name: row.name,
    imageKey: row.imageKey,
  };
  if (!includeExchangeValue) return item;
  return { ...item, exchangeValue: row.exchangeValue };
}

export const GET = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const includeExchangeValue = await userIsSuperAdmin(request.auth.user.id);
    const currencies = orderCurrencies(await getCurrencies());
    return NextResponse.json(
      currencies.map((row) => toCurrencyListItem(row, includeExchangeValue)),
      { status: 200 }
    );
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "GET",
      route,
      message: "Error fetching currencies",
      error,
      details,
    });
    return errorResponse("Error fetching currencies", 500, details);
  }
});
