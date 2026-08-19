import { emitRollEvent } from "@/app/lib/roll-event-client";
import type { GameDetail } from "@/app/lib/types/game";
import type { SubmitInitiativeBody } from "@/app/lib/types/initiative";
import type { RollEventPayload } from "@/app/lib/types/roll-event";
import { submitGameInitiative } from "@/lib/api/game";

export type GmCombatantType = "CHARACTER" | "ENEMY";

export type GmCombatantInitiativeSource =
  | "gmNpcModal"
  | "gmNpcCard"
  | "gmEnemyList";

type GmCombatantInitiativeInput = {
  combatantType: GmCombatantType;
  combatantId: string;
  combatantName?: string;
  rolledValue: number;
  initiativeModifier: number;
};

export type SubmitGmCombatantInitiativeInput = {
  gameId: string;
  combatantType: GmCombatantType;
  combatantId: string;
  combatantName?: string;
  initiativeModifier: number;
  isPrivate: boolean;
  source: GmCombatantInitiativeSource;
};

export function hasCombatantInitiativeEntry(
  game: Pick<GameDetail, "initiativeOrder">,
  combatantType: GmCombatantType,
  combatantId: string
): boolean {
  return (game.initiativeOrder ?? []).some(
    (entry) =>
      entry.combatantType === combatantType && entry.combatantId === combatantId
  );
}

function rollInitiativeD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

export function gmCombatantInitiativeSubmitBody(
  input: GmCombatantInitiativeInput
): SubmitInitiativeBody {
  const trimmedName = input.combatantName?.trim() ?? "";
  if (input.combatantType === "CHARACTER") {
    return {
      combatantType: "CHARACTER",
      combatantId: input.combatantId,
      ...(trimmedName ? { combatantName: trimmedName } : {}),
      rolledValue: input.rolledValue,
      initiativeModifier: input.initiativeModifier,
    };
  }
  return {
    combatantType: "ENEMY",
    combatantId: input.combatantId,
    combatantName: trimmedName.length > 0 ? trimmedName : "Enemy",
    rolledValue: input.rolledValue,
    initiativeModifier: input.initiativeModifier,
  };
}

export function gmCombatantInitiativeRollEvent(
  input: GmCombatantInitiativeInput & {
    isPrivate: boolean;
    source: GmCombatantInitiativeSource;
  }
): RollEventPayload {
  return {
    characterId:
      input.combatantType === "CHARACTER" ? input.combatantId : undefined,
    isPrivate: input.isPrivate ? true : undefined,
    rollType: "INITIATIVE",
    diceExpression: "1d10",
    results: [input.rolledValue],
    total: input.rolledValue + input.initiativeModifier,
    metadata: {
      initiativeModifier: input.initiativeModifier,
      source: input.source,
      combatantType: input.combatantType,
      combatantId: input.combatantId,
      combatantName: input.combatantName ?? null,
      ...(input.combatantType === "ENEMY"
        ? {
            enemyInstanceId: input.combatantId,
            enemyName: input.combatantName ?? null,
          }
        : {}),
    },
  };
}

export async function submitGmCombatantInitiative(
  input: SubmitGmCombatantInitiativeInput
): Promise<GameDetail> {
  const rolledValue = rollInitiativeD10();
  const payload = {
    combatantType: input.combatantType,
    combatantId: input.combatantId,
    combatantName: input.combatantName,
    rolledValue,
    initiativeModifier: input.initiativeModifier,
  };
  const updated = await submitGameInitiative(
    input.gameId,
    gmCombatantInitiativeSubmitBody(payload)
  );
  await emitRollEvent(
    input.gameId,
    gmCombatantInitiativeRollEvent({
      ...payload,
      isPrivate: input.isPrivate,
      source: input.source,
    })
  );
  return updated;
}
