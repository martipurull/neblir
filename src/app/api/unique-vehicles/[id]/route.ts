import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import {
  deleteUniqueVehicle,
  getResolvedUniqueVehicle,
  getUniqueVehicle,
  updateUniqueVehicle,
} from "@/app/lib/prisma/uniqueVehicle";
import { deleteLiveInstancesForUniqueVehicle } from "@/app/lib/prisma/vehicleCharacter";
import { uniqueVehicleUpdateSchema } from "@/app/lib/types/vehicle";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/logger";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      return errorResponse("Invalid unique vehicle ID", 400);
    }

    const vehicle = await getResolvedUniqueVehicle(id);
    if (!vehicle) {
      return errorResponse("Unique vehicle not found", 404);
    }

    const isOwner = vehicle.ownerUserId === request.auth.user.id;
    const inGame = await userIsInGame(vehicle.gameId, request.auth.user.id);
    if (!isOwner && !inGame) {
      return errorResponse(
        "You do not have access to this unique vehicle.",
        403
      );
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/unique-vehicles/[id]",
      message: "Error fetching unique vehicle",
      error,
    });
    return errorResponse(
      "Error fetching unique vehicle",
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
      return errorResponse("Invalid unique vehicle ID", 400);
    }

    const existing = await getUniqueVehicle(id);
    if (!existing) {
      return errorResponse("Unique vehicle not found", 404);
    }

    const game = await getGame(existing.gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }

    const isOwner = existing.ownerUserId === request.auth.user.id;
    const isGameMaster = game.gameMaster === request.auth.user.id;
    if (!isOwner && !isGameMaster) {
      return errorResponse(
        "You do not have access to this unique vehicle.",
        403
      );
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      uniqueVehicleUpdateSchema.safeParse(requestBody);
    if (error) {
      return errorResponse(
        "Error parsing unique vehicle update request",
        400,
        error.issues.map((i) => i.message).join(". ")
      );
    }

    const updated = await updateUniqueVehicle(id, parsedBody);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        "Validation error updating unique vehicle",
        400,
        error.issues.map((i) => `${i.path}: ${i.message}`).join(". ")
      );
    }
    logger.error({
      method: "PATCH",
      route: "/api/unique-vehicles/[id]",
      message: "Error updating unique vehicle",
      error,
    });
    return errorResponse(
      "Error updating unique vehicle",
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
      return errorResponse("Invalid unique vehicle ID", 400);
    }

    const existing = await getUniqueVehicle(id);
    if (!existing) {
      return errorResponse("Unique vehicle not found", 404);
    }

    const game = await getGame(existing.gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }

    const isOwner = existing.ownerUserId === request.auth.user.id;
    const isGameMaster = game.gameMaster === request.auth.user.id;
    if (!isOwner && !isGameMaster) {
      return errorResponse(
        "You do not have access to this unique vehicle.",
        403
      );
    }

    await deleteLiveInstancesForUniqueVehicle(id);
    await deleteUniqueVehicle(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/unique-vehicles/[id]",
      message: "Error deleting unique vehicle",
      error,
    });
    return errorResponse(
      "Error deleting unique vehicle",
      500,
      serializeError(error)
    );
  }
});
