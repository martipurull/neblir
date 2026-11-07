import { z } from "zod";
import {
  botAttributeDiceCount,
  botRollAttribution,
  botRollBlockedMessage,
  isBotAttributeSuccess,
} from "@/app/lib/botAttributeRoll";
import type { BotHolding } from "@/app/lib/types/bot";
import {
  botActionSchema,
  type BotAction,
  type BotActionAttribute,
  type BotActionRoll,
} from "@/app/lib/types/botAction";

/** Pool before extra dice. At least 1, otherwise dice plus the chosen attribute. */
export function botActionPool(
  numberOfDice: number,
  effective: number | null
): number {
  return Math.max(1, numberOfDice + (effective ?? 0));
}

export function readBotActionList(value: unknown): BotAction[] {
  if (value == null) return [];
  const parsed = z.array(botActionSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

/** Null means the unique record does not override the template list. */
export function readBotActionOverride(value: unknown): BotAction[] | null {
  if (value == null) return null;
  const parsed = z.array(botActionSchema).safeParse(value);
  return parsed.success ? parsed.data : null;
}

function effectiveFor(
  attribute: BotActionAttribute | null,
  attributes: BotHolding["attributes"]
): number | null {
  if (attribute == null) return null;
  return attributes[attribute].effective;
}

export function presentBotActionRolls(
  actions: BotAction[],
  attributes: BotHolding["attributes"],
  mayRoll: boolean,
  rollBlockedReason: BotHolding["rollBlockedReason"]
): BotActionRoll[] {
  return actions.map((action, index) => {
    const damage = action.damage;
    return {
      index,
      name: action.name,
      description: action.description,
      notes: action.notes,
      numberOfDice: action.numberOfDice,
      attribute: action.attribute,
      toHitPool: botActionPool(
        action.numberOfDice,
        effectiveFor(action.attribute, attributes)
      ),
      mayRoll,
      rollBlockedReason,
      damage:
        damage == null
          ? null
          : {
              numberOfDice: damage.numberOfDice,
              diceType: damage.diceType,
              damageType: damage.damageType,
              attribute: damage.attribute,
              pool: botActionPool(
                damage.numberOfDice,
                effectiveFor(damage.attribute, attributes)
              ),
            },
    };
  });
}

export function prepareBotActionRoll(input: {
  holding: BotHolding;
  action: BotAction;
  extraDice: number;
  results: number[];
  damageResults?: number[] | null;
  isPrivate: boolean;
  rollerName: string;
  index: number;
  itemCharacterId?: string;
  itemName?: string;
}):
  | {
      ok: true;
      diceExpression: string;
      total: number;
      successes: number;
      damageTotal?: number;
      attribution: string;
      metadata: Record<string, unknown>;
    }
  | { ok: false; message: string } {
  const blocked = botRollBlockedMessage(input.holding);
  if (blocked != null) {
    return { ok: false, message: blocked };
  }

  const pool = botActionPool(
    input.action.numberOfDice,
    effectiveFor(input.action.attribute, input.holding.attributes)
  );
  const count = botAttributeDiceCount(pool, input.extraDice);
  if (count === 0) {
    return { ok: false, message: "A bot action needs at least one die." };
  }
  if (input.results.length !== count) {
    return {
      ok: false,
      message: "Dice count does not match the pool plus extra dice.",
    };
  }

  const damage = input.action.damage;
  const damageResults = input.damageResults ?? null;
  if (damage == null) {
    if (damageResults != null && damageResults.length > 0) {
      return {
        ok: false,
        message: "This bot action has no damage roll.",
      };
    }
  } else if (damageResults == null) {
    return {
      ok: false,
      message: "This bot action includes a damage roll.",
    };
  }

  let damageTotal: number | undefined;
  let damageMeta: Record<string, unknown> | undefined;
  if (damage != null && damageResults != null) {
    const damagePool = botActionPool(
      damage.numberOfDice,
      effectiveFor(damage.attribute, input.holding.attributes)
    );
    const damageCount = botAttributeDiceCount(damagePool, input.extraDice);
    if (damageCount === 0) {
      return {
        ok: false,
        message: "A bot action damage roll needs at least one die.",
      };
    }
    if (damageResults.length !== damageCount) {
      return {
        ok: false,
        message: "Damage dice count does not match the pool plus extra dice.",
      };
    }
    damageTotal = damageResults.reduce((sum, face) => sum + face, 0);
    damageMeta = {
      diceExpression: `${damageCount}d${damage.diceType}`,
      results: damageResults,
      total: damageTotal,
      damageType: damage.damageType,
      baseDice: damagePool,
      ...(damage.attribute != null ? { attribute: damage.attribute } : {}),
    };
  }

  const successes = input.results.filter(isBotAttributeSuccess).length;
  return {
    ok: true,
    diceExpression: `${count}d10`,
    total: successes,
    successes,
    ...(damageTotal != null ? { damageTotal } : {}),
    attribution: botRollAttribution({
      isPrivate: input.isPrivate,
      rollerName: input.rollerName,
      botDisplayName: input.holding.displayName,
    }),
    metadata: {
      label1: input.action.name,
      botCharacterId: input.holding.id,
      botDisplayName: input.holding.displayName,
      extraDice: input.extraDice,
      baseDice: pool,
      actionIndex: input.index,
      ...(input.action.attribute != null
        ? { attribute: input.action.attribute }
        : {}),
      ...(input.itemCharacterId != null
        ? {
            itemCharacterId: input.itemCharacterId,
            itemName: input.itemName ?? "Item",
          }
        : {}),
      ...(damageMeta != null ? { damage: damageMeta } : {}),
    },
  };
}
