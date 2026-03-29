import type { CharacterDetail } from "@/app/lib/types/character";
import type { LevelUpAttributePath } from "@/lib/api/character";

export function rollD10() {
  return Math.floor(Math.random() * 10) + 1;
}

export function getInnateAttributeValueForPath(
  character: CharacterDetail,
  path: LevelUpAttributePath
): number {
  const [group, key] = path.split(".") as [string, string];
  const value =
    (
      character.innateAttributes[
        group as keyof typeof character.innateAttributes
      ] as Record<string, number> | undefined
    )?.[key] ?? 0;
  return value;
}
