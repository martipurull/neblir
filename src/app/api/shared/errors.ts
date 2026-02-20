import { Prisma } from "@prisma/client";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Serialise an unknown error for logging and API responses.
 * Ensures Prisma and standard Error instances expose message/stack instead of "{}".
 */
export function serializeError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientValidationError) {
    return JSON.stringify({
      name: "PrismaClientValidationError",
      message: error.message,
    });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return JSON.stringify({
      name: "PrismaClientKnownRequestError",
      code: error.code,
      message: error.message,
      meta: error.meta,
    });
  }
  if (error instanceof Error) {
    return JSON.stringify({
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  }
  return JSON.stringify(error);
}
