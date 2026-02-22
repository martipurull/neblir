import { Prisma } from "@prisma/client";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

type CharacterCreationStep =
  | "createCharacter"
  | "createCharacterUser"
  | "createPathCharacter";

export class CharacterCreationTransactionError extends Error {
  constructor(
    public step: CharacterCreationStep,
    public details?: string
  ) {
    super(`Failed at transaction step: ${step}`);
    this.name = "CharacterCreationTransactionError";
  }
}

type CharacterDeletionStep =
  | "deletePathCharacters"
  | "deleteFeatureCharacters"
  | "deleteGameCharacters"
  | "deleteCharacterUsers"
  | "deleteCharacterInventory"
  | "deleteCharacterWallet"
  | "deleteCharacter";

export class CharacterDeletionTransactionError extends Error {
  constructor(
    public step: CharacterDeletionStep,
    public details?: string
  ) {
    super(`Failed at transaction step: ${step}`);
    this.name = "CharacterDeletionTransactionError";
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
