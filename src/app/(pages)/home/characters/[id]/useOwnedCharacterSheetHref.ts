"use client";

import { characterSheetHref } from "@/app/lib/navParent";
import { useSearchParams } from "next/navigation";

export function useOwnedCharacterSheetHref(characterId: string | null): string {
  const searchParams = useSearchParams();
  if (characterId == null || characterId.length === 0)
    return "/home/characters";
  return characterSheetHref({
    characterId,
    returnTo: searchParams.get("returnTo"),
  });
}
