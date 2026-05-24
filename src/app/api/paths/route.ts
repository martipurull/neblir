import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import { createPath, findPathByName, getPaths } from "@/app/lib/prisma/path";
import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { pathCreateSchema } from "@/app/lib/types/path";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../shared/errors";
import { errorResponse } from "../shared/responses";

export const POST = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/paths",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    if (!(await userIsSuperAdmin(request.auth.user.id))) {
      return errorResponse("Forbidden", 403);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } = pathCreateSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "POST",
        route: "/api/paths",
        message: "Error parsing path creation request",
        details: error,
      });
      return errorResponse(
        "Error parsing path creation request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const existing = await findPathByName(parsedBody.name);
    if (existing) {
      return errorResponse("A path with this name already exists", 409);
    }

    const path = await createPath({
      ...parsedBody,
      protectedFromOfficialImport: true,
    });

    await touchStaffCatalogueDrift(["paths"]);
    return NextResponse.json(path, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse("A path with this name already exists", 409);
    }
    logger.error({
      method: "POST",
      route: "/api/paths",
      message: "Error creating path",
      error,
    });
    return errorResponse("Error creating path", 500, serializeError(error));
  }
});

export const GET = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/paths",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const paths = await getPaths();

    return NextResponse.json(paths);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/paths",
      message: "Error fetching paths",
      error,
    });
    return errorResponse("Error fetching paths", 500, serializeError(error));
  }
});
