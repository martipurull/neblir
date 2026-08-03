import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import { createVehicle, getVehicles } from "@/app/lib/prisma/vehicle";
import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { vehicleSchema } from "@/app/lib/types/vehicle";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../shared/errors";
import { errorResponse } from "../shared/responses";

export const POST = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/vehicles",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    if (!(await userIsSuperAdmin(request.auth.user.id))) {
      return errorResponse("Forbidden", 403);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } = vehicleSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "POST",
        route: "/api/vehicles",
        message: "Error parsing vehicle creation request",
        details: error,
      });
      return errorResponse(
        "Error parsing vehicle creation request",
        400,
        JSON.stringify(error)
      );
    }

    const vehicle = await createVehicle(parsedBody, {
      officialCatalogueWrite: true,
    });
    await touchStaffCatalogueDrift(["vehicles"]);

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "POST",
      route: "/api/vehicles",
      message: "Error creating vehicle",
      error,
      details,
    });
    return errorResponse("Error creating vehicle", 500, details);
  }
});

export const GET = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/vehicles",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const vehicles = await getVehicles();

    return NextResponse.json(vehicles);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/vehicles",
      message: "Error fetching vehicles",
      error,
    });
    return errorResponse("Error fetching vehicles", 500, serializeError(error));
  }
});
