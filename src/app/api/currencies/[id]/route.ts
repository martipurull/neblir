import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import { deleteUnreferencedCatalogueImageIfUnused } from "@/app/lib/officialCatalogueImage";
import { countCurrencyHoldings } from "@/app/lib/prisma/characterCurrency";
import {
  deleteCurrency,
  getCurrencies,
  getCurrency,
  updateCurrency,
} from "@/app/lib/prisma/currency";
import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import type { AuthNextRequest } from "@/app/lib/types/api";
import {
  CONF_CURRENCY_LOCK_MESSAGE,
  confCurrencyWriteIsLocked,
  currencyUpdateSchema,
  isConfCurrency,
} from "@/app/lib/types/currency";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../shared/errors";
import {
  responseIfOfficialNameTaken,
  responseIfOfficialNameUniqueConstraint,
} from "../../shared/officialNameConflict";
import { errorResponse } from "../../shared/responses";

const route = "/api/currencies/[id]";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }
    if (!(await userIsSuperAdmin(request.auth.user.id))) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = (await params) as { id: string };
    if (!id?.trim()) {
      return errorResponse("Invalid currency ID", 400);
    }

    const currency = await getCurrency(id.trim());
    if (!currency) {
      return errorResponse("Currency not found", 404);
    }
    return NextResponse.json(currency, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route,
      message: "Error fetching currency",
      error,
    });
    return errorResponse("Error fetching currency", 500, serializeError(error));
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }
    if (!(await userIsSuperAdmin(request.auth.user.id))) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = (await params) as { id: string };
    if (!id?.trim()) {
      return errorResponse("Invalid currency ID", 400);
    }

    const existing = await getCurrency(id.trim());
    if (!existing) {
      return errorResponse("Currency not found", 404);
    }

    const body = await request.json();
    const parsed = currencyUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "Error parsing currency update request",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return errorResponse("No fields to update", 400);
    }

    if (
      isConfCurrency(existing.name) &&
      confCurrencyWriteIsLocked({
        existing,
        name: parsed.data.name,
        exchangeValue: parsed.data.exchangeValue,
      })
    ) {
      return errorResponse(CONF_CURRENCY_LOCK_MESSAGE, 400);
    }

    if (parsed.data.name !== undefined) {
      const conflict = responseIfOfficialNameTaken(
        await getCurrencies(),
        parsed.data.name,
        id.trim()
      );
      if (conflict) return conflict;
    }

    if (
      confCurrencyWriteIsLocked({
        existing,
        name: parsed.data.name,
        exchangeValue: parsed.data.exchangeValue,
      })
    ) {
      return errorResponse(CONF_CURRENCY_LOCK_MESSAGE, 400);
    }

    const updated = await updateCurrency(id.trim(), {
      ...parsed.data,
      protectedFromOfficialImport: true,
    });
    await touchStaffCatalogueDrift(["currencies"]);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    const uniqueConflict = responseIfOfficialNameUniqueConstraint(error);
    if (uniqueConflict) return uniqueConflict;
    logger.error({
      method: "PATCH",
      route,
      message: "Error updating currency",
      error,
    });
    return errorResponse("Error updating currency", 500, serializeError(error));
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }
    if (!(await userIsSuperAdmin(request.auth.user.id))) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = (await params) as { id: string };
    if (!id?.trim()) {
      return errorResponse("Invalid currency ID", 400);
    }

    const existing = await getCurrency(id.trim());
    if (!existing) {
      return errorResponse("Currency not found", 404);
    }

    if ((await countCurrencyHoldings(id.trim())) > 0) {
      return errorResponse("A character holds this currency", 409);
    }

    await deleteCurrency(id.trim());
    await deleteUnreferencedCatalogueImageIfUnused(existing.imageKey);
    await touchStaffCatalogueDrift(["currencies"]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route,
      message: "Error deleting currency",
      error,
    });
    return errorResponse("Error deleting currency", 500, serializeError(error));
  }
});
