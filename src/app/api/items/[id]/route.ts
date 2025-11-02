import { deleteItem, getItem, updateItem } from "@/app/lib/prisma/item";
import { AuthNextRequest } from "@/app/lib/types/api";
import { itemUpdateSchema } from "@/app/lib/types/item";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import logger from "@/logger";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/items/[id]",
        message: "Unauthorised access attempt",
      });
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "GET",
        route: "/api/items/[id]",
        message: "Invalid item ID",
        itemId: id,
      });
      return NextResponse.json({ message: "Invalid item ID" }, { status: 400 });
    }

    const item = await getItem(id);

    return NextResponse.json(item, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/items/[id]",
      message: "Error fetching item",
      error,
    });
    return NextResponse.error();
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "PATCH",
        route: "/api/items/[id]",
        message: "Unauthorised access attempt",
      });
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "PATCH",
        route: "/api/items/[id]",
        message: "Invalid item ID",
        itemId: id,
      });
      return NextResponse.json({ message: "Invalid item ID" }, { status: 400 });
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } = itemUpdateSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "PATCH",
        route: "/api/items/[id]",
        message: "Error parsing item update request",
        details: error,
      });
      return NextResponse.error();
    }

    const updatedItem = await updateItem(id, parsedBody);

    return NextResponse.json(updatedItem);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error({
        method: "PATCH",
        route: "/api/items/[id]",
        message: "Validation error updating item",
        details: error.issues,
      });
      return NextResponse.json(
        `Bad Request:\n${error.issues.map((issue) => `${issue.code} at ${issue.path}: ${issue.message}.`)}`,
        { status: 400 }
      );
    }
    logger.error({
      method: "PATCH",
      route: "/api/items/[id]",
      message: "Error updating item",
      error,
    });
    return NextResponse.error();
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "DELETE",
        route: "/api/items/[id]",
        message: "Unauthorised access attempt",
      });
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "DELETE",
        route: "/api/items/[id]",
        message: "Invalid item ID",
        itemId: id,
      });
      return NextResponse.json({ message: "Invalid item ID" }, { status: 400 });
    }

    await deleteItem(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/items/[id]",
      message: "Error deleting item",
      error,
    });
    return NextResponse.error();
  }
});
