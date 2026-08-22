import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import {
  deleteVehicle,
  getVehicle,
  updateVehicle,
} from "@/app/lib/prisma/vehicle";
import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { vehicleUpdateSchema } from "@/app/lib/types/vehicle";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/vehicles/[id]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "GET",
        route: "/api/vehicles/[id]",
        message: "Invalid vehicle ID",
        vehicleId: id,
      });
      return errorResponse("Invalid vehicle ID", 400);
    }

    const vehicle = await getVehicle(id);
    return NextResponse.json(vehicle, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/vehicles/[id]",
      message: "Error fetching vehicle",
      error,
    });
    return errorResponse("Error fetching vehicle", 500, serializeError(error));
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "PATCH",
        route: "/api/vehicles/[id]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    if (!(await userIsSuperAdmin(request.auth.user.id))) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "PATCH",
        route: "/api/vehicles/[id]",
        message: "Invalid vehicle ID",
        vehicleId: id,
      });
      return errorResponse("Invalid vehicle ID", 400);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      vehicleUpdateSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "PATCH",
        route: "/api/vehicles/[id]",
        message: "Error parsing vehicle update request",
        details: error,
      });
      return errorResponse(
        "Error parsing vehicle update request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const updatedVehicle = await updateVehicle(id, parsedBody, {
      officialCatalogueWrite: true,
    });
    await touchStaffCatalogueDrift(["vehicles"]);

    return NextResponse.json(updatedVehicle);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error({
        method: "PATCH",
        route: "/api/vehicles/[id]",
        message: "Validation error updating vehicle",
        details: error.issues,
      });
      return errorResponse(
        "Validation error updating vehicle",
        400,
        error.issues
          .map((issue) => `${issue.code} at ${issue.path}: ${issue.message}.`)
          .join("\n")
      );
    }
    logger.error({
      method: "PATCH",
      route: "/api/vehicles/[id]",
      message: "Error updating vehicle",
      error,
    });
    return errorResponse("Error updating vehicle", 500, serializeError(error));
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "DELETE",
        route: "/api/vehicles/[id]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    if (!(await userIsSuperAdmin(request.auth.user.id))) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "DELETE",
        route: "/api/vehicles/[id]",
        message: "Invalid vehicle ID",
        vehicleId: id,
      });
      return errorResponse("Invalid vehicle ID", 400);
    }

    await deleteVehicle(id);
    await touchStaffCatalogueDrift(["vehicles"]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/vehicles/[id]",
      message: "Error deleting vehicle",
      error,
    });
    return errorResponse("Error deleting vehicle", 500, serializeError(error));
  }
});
