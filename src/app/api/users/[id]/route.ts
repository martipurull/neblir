import { deleteUser, getUser, updateUser } from "@/app/lib/prisma/user";
import { AuthNextRequest } from "@/app/lib/types/api";
import { userUpdateSchema } from "@/app/lib/types/user";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/users/[id]",
        message: "Unauthorised access attempt",
      });
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "GET",
        route: "/api/users/[id]",
        message: "Invalid user ID",
        userId: id,
      });
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }
    if (request.auth?.user?.id !== id) {
      logger.error({
        method: "GET",
        route: "/api/users/[id]",
        message: "User does not have access to this resource",
        userId: id,
      });
      return NextResponse.json({ status: 403 });
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
    return NextResponse.error();
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
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "PATCH",
        route: "/api/users/[id]",
        message: "Invalid user ID",
        userId: id,
      });
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }
    if (request.auth?.user?.id !== id) {
      logger.error({
        method: "PATCH",
        route: "/api/users/[id]",
        message: "User does not have access to this resource",
        userId: id,
      });
      return NextResponse.json({ status: 403 });
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
      return NextResponse.json({ message: error.issues }, { status: 400 });
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
    return NextResponse.error();
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
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "DELETE",
        route: "/api/users/[id]",
        message: "Invalid user ID",
        userId: id,
      });
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }
    if (request.auth?.user?.id !== id) {
      logger.error({
        method: "DELETE",
        route: "/api/users/[id]",
        message: "User does not have access to this resource",
        userId: id,
      });
      return NextResponse.json({ status: 403 });
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
    return NextResponse.error();
  }
});
