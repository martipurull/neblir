import { createUser } from "@/app/lib/prisma/user";
import { userCreateSchema } from "@/app/lib/types/user";
import { NextRequest, NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../shared/errors";
import { errorResponse } from "../shared/responses";

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { data: parsedBody, error } = userCreateSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "POST",
        route: "/api/users",
        message: "Error parsing user creation request",
        details: error,
      });
      return errorResponse(
        "Error parsing user creation request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const user = await createUser(parsedBody);

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/users",
      message: "Error creating user",
      error,
    });
    return errorResponse("Error creating user", 500, serializeError(error));
  }
}
