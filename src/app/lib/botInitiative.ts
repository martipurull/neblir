import {
  botRollAttribution,
  botRollBlockedMessage,
} from "@/app/lib/botAttributeRoll";
import type { BotHolding } from "@/app/lib/types/bot";

const BOT_INITIATIVE_EXTRA_DICE_MESSAGE =
  "A bot initiative roll does not accept extra dice.";

const BOT_INITIATIVE_DICE_MESSAGE = "A bot initiative roll is one d10.";

/** Effective Processing Power plus effective Finesse Capacity, divided by 2 toward zero. */
export function botInitiativeModifier(
  processingPower: number,
  finesseCapacity: number
): number {
  return Math.trunc((processingPower + finesseCapacity) / 2);
}

export function prepareBotInitiativeRoll(input: {
  holding: BotHolding;
  results: number[];
  extraDice?: number;
  isPrivate: boolean;
  rollerName: string;
}):
  | {
      ok: true;
      face: number;
      modifier: number;
      diceExpression: string;
      total: number;
      attribution: string;
      metadata: Record<string, unknown>;
    }
  | { ok: false; message: string } {
  if (input.extraDice != null) {
    return { ok: false, message: BOT_INITIATIVE_EXTRA_DICE_MESSAGE };
  }

  const blocked = botRollBlockedMessage(input.holding);
  if (blocked != null) {
    return { ok: false, message: blocked };
  }

  const face = input.results[0];
  if (
    input.results.length !== 1 ||
    face == null ||
    !Number.isInteger(face) ||
    face < 1 ||
    face > 10
  ) {
    return { ok: false, message: BOT_INITIATIVE_DICE_MESSAGE };
  }

  const modifier = botInitiativeModifier(
    input.holding.attributes.processingPower.effective,
    input.holding.attributes.finesseCapacity.effective
  );

  return {
    ok: true,
    face,
    modifier,
    diceExpression: "1d10",
    total: face + modifier,
    attribution: botRollAttribution({
      isPrivate: input.isPrivate,
      rollerName: input.rollerName,
      botDisplayName: input.holding.displayName,
    }),
    metadata: {
      label1: "Initiative",
      initiativeModifier: modifier,
      botCharacterId: input.holding.id,
      botDisplayName: input.holding.displayName,
    },
  };
}
