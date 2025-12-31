import { deleteUser, getUser, updateUser } from "@/app/lib/prisma/user";
import { AuthNextRequest } from "@/app/lib/types/api";
import { userUpdateSchema } from "@/app/lib/types/user";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { errorResponse } from "../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/users/[id]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "GET",
        route: "/api/users/[id]",
        message: "Invalid user ID",
        userId: id,
      });
      return errorResponse("Invalid user ID", 400);
    }
    if (request.auth?.user?.id !== id) {
      logger.error({
        method: "GET",
        route: "/api/users/[id]",
        message: "User does not have access to this resource",
        userId: id,
      });
      return errorResponse("User does not have access to this resource", 403);
    }

    const user = await getUser(id);

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/users/[id]",
      message: "Error fetching user",
      error,
    });
    return errorResponse("Error fetching user", 500, JSON.stringify(error));
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "PATCH",
        route: "/api/users/[id]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "PATCH",
        route: "/api/users/[id]",
        message: "Invalid user ID",
        userId: id,
      });
      return errorResponse("Invalid user ID", 400);
    }
    if (request.auth?.user?.id !== id) {
      logger.error({
        method: "PATCH",
        route: "/api/users/[id]",
        message: "User does not have access to this resource",
        userId: id,
      });
      return errorResponse("User does not have access to this resource", 403);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } = userUpdateSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "PATCH",
        route: "/api/users/[id]",
        message: "Error parsing user update request",
        details: error,
      });
      return errorResponse(
        "Error parsing user update request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const updatedUser = await updateUser(id, parsedBody);

    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/users/[id]",
      message: "Error updating user",
      error,
    });
    return errorResponse("Error updating user", 500, JSON.stringify(error));
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "DELETE",
        route: "/api/users/[id]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "DELETE",
        route: "/api/users/[id]",
        message: "Invalid user ID",
        userId: id,
      });
      return errorResponse("Invalid user ID", 400);
    }
    if (request.auth?.user?.id !== id) {
      logger.error({
        method: "DELETE",
        route: "/api/users/[id]",
        message: "User does not have access to this resource",
        userId: id,
      });
      return errorResponse("User does not have access to this resource", 403);
    }

    await deleteUser(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/users/[id]",
      message: "Error deleting user",
      error,
    });
    return errorResponse("Error deleting user", 500, JSON.stringify(error));
  }
});
