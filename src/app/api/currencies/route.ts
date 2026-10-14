import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import { createCurrency, getCurrencies } from "@/app/lib/prisma/currency";
import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import type { AuthNextRequest } from "@/app/lib/types/api";
import {
  CONF_CURRENCY_LOCK_MESSAGE,
  confCurrencyWriteIsLocked,
  currencyCreateSchema,
} from "@/app/lib/types/currency";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../shared/errors";
import {
  responseIfOfficialNameTaken,
  responseIfOfficialNameUniqueConstraint,
} from "../shared/officialNameConflict";
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

export const POST = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }
    if (!(await userIsSuperAdmin(request.auth.user.id))) {
      return errorResponse("Forbidden", 403);
    }

    const requestBody = await request.json();
    const parsed = currencyCreateSchema.safeParse(requestBody);
    if (!parsed.success) {
      return errorResponse(
        "Error parsing currency creation request",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const conflict = responseIfOfficialNameTaken(
      await getCurrencies(),
      parsed.data.name
    );
    if (conflict) return conflict;

    if (
      confCurrencyWriteIsLocked({
        existing: null,
        name: parsed.data.name,
        exchangeValue: parsed.data.exchangeValue,
      })
    ) {
      return errorResponse(CONF_CURRENCY_LOCK_MESSAGE, 400);
    }

    const currency = await createCurrency({
      ...parsed.data,
      protectedFromOfficialImport: true,
    });
    await touchStaffCatalogueDrift(["currencies"]);
    return NextResponse.json(currency, { status: 201 });
  } catch (error) {
    const uniqueConflict = responseIfOfficialNameUniqueConstraint(error);
    if (uniqueConflict) return uniqueConflict;
    const details = serializeError(error);
    logger.error({
      method: "POST",
      route,
      message: "Error creating currency",
      error,
      details,
    });
    return errorResponse("Error creating currency", 500, details);
  }
});
