import {
  deleteUniqueItem,
  getResolvedUniqueItem,
  getUniqueItem,
  updateUniqueItem,
} from "@/app/lib/prisma/uniqueItem";
import { uniqueItemUpdateSchema } from "@/app/lib/types/item";
import { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import logger from "@/logger";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      return errorResponse("Invalid unique item ID", 400);
    }

    const item = await getResolvedUniqueItem(id);
    if (!item) {
      return errorResponse("Unique item not found", 404);
    }

    return NextResponse.json(item);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/unique-items/[id]",
      message: "Error fetching unique item",
      error,
    });
    return errorResponse(
      "Error fetching unique item",
      500,
      serializeError(error)
    );
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      return errorResponse("Invalid unique item ID", 400);
    }

    const existing = await getUniqueItem(id);
    if (!existing) {
      return errorResponse("Unique item not found", 404);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      uniqueItemUpdateSchema.safeParse(requestBody);
    if (error) {
      return errorResponse(
        "Error parsing unique item update request",
        400,
        error.issues.map((i) => i.message).join(". ")
      );
    }

    const updated = await updateUniqueItem(id, parsedBody);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        "Validation error updating unique item",
        400,
        error.issues.map((i) => `${i.path}: ${i.message}`).join(". ")
      );
    }
    logger.error({
      method: "PATCH",
      route: "/api/unique-items/[id]",
      message: "Error updating unique item",
      error,
    });
    return errorResponse(
      "Error updating unique item",
      500,
      serializeError(error)
    );
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      return errorResponse("Invalid unique item ID", 400);
    }

    const existing = await getUniqueItem(id);
    if (!existing) {
      return errorResponse("Unique item not found", 404);
    }

    await deleteUniqueItem(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/unique-items/[id]",
      message: "Error deleting unique item",
      error,
    });
    return errorResponse(
      "Error deleting unique item",
      500,
      serializeError(error)
    );
  }
});
