import { deleteUser, getUser } from "@/app/lib/prisma/user";
import { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import logger from "@/logger";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";
import { NextResponse } from "next/server";

export const GET = auth(async (request: AuthNextRequest) => {
  try {
    const userId = request.auth?.user?.id;

    if (!userId) {
      logger.error({
        method: "GET",
        route: "/api/users/me",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const user = await getUser(userId);
    if (!user) {
      logger.error({
        method: "GET",
        route: "/api/users/me",
        message: "User not found",
        userId,
      });
      return errorResponse("User not found", 404);
    }

    return NextResponse.json(
      {
        name: user.name,
        email: user.email,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/users/me",
      message: "Error fetching current user",
      error,
    });
    return errorResponse(
      "Error fetching current user",
      500,
      serializeError(error)
    );
  }
});

export const DELETE = auth(async (request: AuthNextRequest) => {
  try {
    const userId = request.auth?.user?.id;

    if (!userId) {
      logger.error({
        method: "DELETE",
        route: "/api/users/me",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    await deleteUser(userId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/users/me",
      message: "Error deleting current user",
      error,
    });
    return errorResponse(
      "Error deleting current user",
      500,
      serializeError(error)
    );
  }
});
