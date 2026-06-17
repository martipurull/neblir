import type { CharacterLayoutMode } from "@/app/lib/types/user";
import type { CharacterLayoutMode as PrismaCharacterLayoutMode } from "@prisma/client";

export function toDbCharacterLayoutMode(
  mode: CharacterLayoutMode | null | undefined
): PrismaCharacterLayoutMode | null | undefined {
  if (mode === "horizontal") return "HORIZONTAL";
  if (mode === "vertical") return "VERTICAL";
  if (mode === null) return null;
  return undefined;
}

export function toApiCharacterLayoutMode(
  mode: PrismaCharacterLayoutMode | null | undefined
): CharacterLayoutMode | null {
  if (mode === "HORIZONTAL") return "horizontal";
  if (mode === "VERTICAL") return "vertical";
  return null;
}
