import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import type { AuthNextRequest } from "@/app/lib/types/api";
import {
  acknowledgeStaffCatalogueDrift,
  getStaffCatalogueDriftState,
} from "@/app/lib/prisma/staffCatalogueDrift";
import { auth } from "@/auth";
import logger from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

const route = "/api/staff/catalogue-drift";

export const GET = auth(async (request: AuthNextRequest) => {
  try {
    const userId = request.auth?.user?.id;
    if (!userId) {
      return errorResponse("Unauthorised", 401);
    }
    if (!(await userIsSuperAdmin(userId))) {
      return errorResponse("Forbidden", 403);
    }

    const state = await getStaffCatalogueDriftState();
    return NextResponse.json(state, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route,
      message: "Error fetching catalogue drift state",
      error,
    });
    return errorResponse(
      "Error fetching catalogue drift state",
      500,
      serializeError(error)
    );
  }
});

export const PATCH = auth(async (request: AuthNextRequest) => {
  try {
    const userId = request.auth?.user?.id;
    if (!userId) {
      return errorResponse("Unauthorised", 401);
    }
    if (!(await userIsSuperAdmin(userId))) {
      return errorResponse("Forbidden", 403);
    }

    await acknowledgeStaffCatalogueDrift();
    const state = await getStaffCatalogueDriftState();
    return NextResponse.json(state, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route,
      message: "Error acknowledging catalogue drift state",
      error,
    });
    return errorResponse(
      "Error acknowledging catalogue drift state",
      500,
      serializeError(error)
    );
  }
});
