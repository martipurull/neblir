import { isD10Success } from "@/app/lib/diceResults";
import {
  BOT_UPGRADE_LABELS,
  type BotRollBlockReason,
} from "@/app/lib/botTracks";
import type { BotHolding } from "@/app/lib/types/bot";

/** Attributes a bot can roll. Battery is not one of them. */
export const BOT_ATTRIBUTE_ROLLS = [
  "processingPower",
  "physicalPower",
  "finesseCapacity",
  "gridProtection",
] as const;

export type BotAttributeRoll = (typeof BOT_ATTRIBUTE_ROLLS)[number];

const BOT_ATTRIBUTE_ROLL_SET = new Set<string>(BOT_ATTRIBUTE_ROLLS);

export function isBotAttributeRoll(value: string): value is BotAttributeRoll {
  return BOT_ATTRIBUTE_ROLL_SET.has(value);
}

/** An 8, 9, or 10 on the bot's d10 pool. */
export function isBotAttributeSuccess(face: number): boolean {
  return isD10Success(face) && face <= 10;
}

/** Pool before extra dice. At least 1, otherwise the effective attribute. */
export function botAttributePool(effective: number): number {
  return Math.max(1, effective);
}

/** Floored pool plus extra dice, never below 0. */
export function botAttributeDiceCount(pool: number, extraDice: number): number {
  return Math.max(0, Math.floor(pool) + extraDice);
}

const BLOCKED_ROLL_MESSAGE: Record<BotRollBlockReason, string> = {
  BROKEN: "This bot cannot roll while it is Broken.",
  BEYOND_REPAIR: "This bot cannot roll while it is Beyond repair.",
  BATTERY_EMPTY: "This bot cannot roll while its battery is empty.",
};

export function botRollAttribution(options: {
  isPrivate: boolean;
  rollerName: string;
  botDisplayName: string;
}): string {
  if (options.isPrivate) return "SECRET ROLL";
  return `${options.rollerName} as ${options.botDisplayName}`;
}

export function prepareBotAttributeRoll(input: {
  holding: BotHolding;
  attribute: BotAttributeRoll;
  extraDice: number;
  results: number[];
  isPrivate: boolean;
  rollerName: string;
}):
  | {
      ok: true;
      diceExpression: string;
      total: number;
      successes: number;
      attribution: string;
      metadata: Record<string, unknown>;
    }
  | { ok: false; message: string } {
  if (!input.holding.mayRoll) {
    const reason = input.holding.rollBlockedReason;
    return {
      ok: false,
      message:
        reason == null ? "This bot cannot roll." : BLOCKED_ROLL_MESSAGE[reason],
    };
  }

  const pool = botAttributePool(
    input.holding.attributes[input.attribute].effective
  );
  const count = botAttributeDiceCount(pool, input.extraDice);
  if (count === 0) {
    return {
      ok: false,
      message: "A bot attribute roll needs at least one die.",
    };
  }
  if (input.results.length !== count) {
    return {
      ok: false,
      message: "Dice count does not match the pool plus extra dice.",
    };
  }

  const successes = input.results.filter(isBotAttributeSuccess).length;

  return {
    ok: true,
    diceExpression: `${count}d10`,
    total: successes,
    successes,
    attribution: botRollAttribution({
      isPrivate: input.isPrivate,
      rollerName: input.rollerName,
      botDisplayName: input.holding.displayName,
    }),
    metadata: {
      label1: BOT_UPGRADE_LABELS[input.attribute],
      attribute: input.attribute,
      botCharacterId: input.holding.id,
      botDisplayName: input.holding.displayName,
      extraDice: input.extraDice,
      baseDice: pool,
    },
  };
}
