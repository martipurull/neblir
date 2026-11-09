import { parseCombatantRef } from "@/app/lib/initiativeCombatantRef";
import { sortInitiativeEntries } from "@/app/lib/initiativeOrder";
import type { GameDetail } from "@/app/lib/types/game";

type GameDetailInitiativeEntry = NonNullable<
  GameDetail["initiativeOrder"]
>[number];

function sortGameDetailInitiative(
  entries: GameDetailInitiativeEntry[]
): GameDetailInitiativeEntry[] {
  return sortInitiativeEntries(entries).map((entry) => ({
    ...entry,
    totalInitiative: entry.rolledValue + entry.initiativeModifier,
  }));
}

export function withClearedInitiative(game: GameDetail): GameDetail {
  return { ...game, initiativeOrder: [] };
}

export function withRemovedInitiativeEntry(
  game: GameDetail,
  combatantRef: string
): GameDetail {
  const parsed = parseCombatantRef(combatantRef);
  if (!parsed) return game;
  return {
    ...game,
    initiativeOrder: (game.initiativeOrder ?? []).filter(
      (entry) =>
        !(
          entry.combatantType === parsed.combatantType &&
          entry.combatantId === parsed.combatantId
        )
    ),
  };
}

export function withAdjustedInitiativeEntry(
  game: GameDetail,
  combatantRef: string,
  initiativeDelta: number
): GameDetail {
  const parsed = parseCombatantRef(combatantRef);
  if (!parsed) return game;
  const next = (game.initiativeOrder ?? []).map((entry) => {
    if (
      entry.combatantType !== parsed.combatantType ||
      entry.combatantId !== parsed.combatantId
    ) {
      return entry;
    }
    const initiativeModifier = entry.initiativeModifier + initiativeDelta;
    return {
      ...entry,
      initiativeModifier,
      totalInitiative: entry.rolledValue + initiativeModifier,
    };
  });
  return { ...game, initiativeOrder: sortGameDetailInitiative(next) };
}
