import { createItem, getItems } from "@/app/lib/prisma/item";
import { AuthNextRequest } from "@/app/lib/types/api";
import { itemSchema } from "@/app/lib/types/item";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../shared/errors";
import { errorResponse } from "../shared/responses";

export const POST = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/items",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } = itemSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "POST",
        route: "/api/items",
        message: "Error parsing item creation request",
        details: error,
      });
      return errorResponse(
        "Error parsing item creation request",
        400,
        JSON.stringify(error)
      );
    }

    const item = await createItem(parsedBody);

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "POST",
      route: "/api/items",
      message: "Error creating item",
      error,
      details,
    });
    return errorResponse("Error creating item", 500, details);
  }
});

export const GET = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/items",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const items = await getItems();

    return NextResponse.json(items);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/items",
      message: "Error fetching items",
      error,
    });
    return errorResponse("Error fetching items", 500, serializeError(error));
  }
});
