import { createPath, getPaths } from "@/app/lib/prisma/path";
import { AuthNextRequest } from "@/app/lib/types/api";
import { pathSchema } from "@/app/lib/types/path";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";

export const POST = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/paths",
        message: "Unauthorised access attempt",
      });
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
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
      return NextResponse.json({ message: error.issues }, { status: 400 });
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
    return NextResponse.error();
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
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
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
    return NextResponse.error();
  }
});
