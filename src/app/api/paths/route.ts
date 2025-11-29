import { createPath, getPaths } from "@/app/lib/prisma/path";
import { AuthNextRequest } from "@/app/lib/types/api";
import { pathSchema } from "@/app/lib/types/path";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
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

    const requestBody = await request.json();
    const { data: parsedBody, error } = pathSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "POST",
        route: "/api/paths",
        message: "Error parsing path creation request",
        details: error,
      });
      return errorResponse("Error parsing path creation request", 400, error.issues.map((issue) => issue.message).join(". "));
    }

    const item = await createPath(parsedBody);

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/paths",
      message: "Error creating path",
      error,
    });
    return errorResponse("Error creating path", 500, JSON.stringify(error));
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
    return errorResponse("Error fetching paths", 500, JSON.stringify(error));
  }
});
