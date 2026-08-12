import type {
  EnemyInstanceRow,
  GameCharacterRow,
  InitiativeEntry,
} from "./gmCombatInitiativeTypes";

export function characterSheetHref(
  gameId: string,
  character: GameCharacterRow["character"]
): string {
  if (character.isOwnedByCurrentUser) {
    return `/home/characters/${character.id}?returnTo=${encodeURIComponent(`/home/games/${gameId}/gm`)}`;
  }
  return `/home/games/${gameId}/characters/${character.id}`;
}

export function buildCharacterById(
  rows: GameCharacterRow[] | null | undefined
): Map<string, GameCharacterRow["character"]> {
  const map = new Map<string, GameCharacterRow["character"]>();
  for (const row of rows ?? []) {
    map.set(row.character.id, row.character);
  }
  return map;
}

export function buildEnemyById(
  rows: EnemyInstanceRow[] | null | undefined
): Map<string, EnemyInstanceRow> {
  const map = new Map<string, EnemyInstanceRow>();
  for (const row of rows ?? []) {
    map.set(row.id, row);
  }
  return map;
}

export function buildInitiativeImageEntries(
  initiativeOrder: InitiativeEntry[],
  characterById: Map<string, GameCharacterRow["character"]>,
  enemyById: Map<string, EnemyInstanceRow>
): Array<{ id: string; imageKey: string | null }> {
  return initiativeOrder.flatMap((entry) => {
    if (entry.combatantType === "CHARACTER") {
      const character = characterById.get(entry.combatantId);
      if (!character) return [];
      return [{ id: character.id, imageKey: character.avatarKey ?? null }];
    }

    const enemy = enemyById.get(entry.combatantId);
    if (!enemy) return [];
    return [{ id: enemy.id, imageKey: enemy.imageKey ?? null }];
  });
}
