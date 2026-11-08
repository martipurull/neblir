import {
  botAttackPool,
  botDefencePool,
  BOT_COMBAT_LABELS,
  isBotAttack,
  type BotAttack,
  type BotCombatStats,
  type BotCombatValue,
  type BotDefence,
} from "@/app/lib/botCombat";
import {
  botAttributeDiceCount,
  botRollAttribution,
  botRollBlockedMessage,
  isBotAttributeSuccess,
} from "@/app/lib/botAttributeRoll";
import type { BotHolding } from "@/app/lib/types/bot";

const BOT_WEAPON_NOT_IN_HAND_MESSAGE =
  "That weapon is not a bot-equipped hand weapon for this attack.";

const BOT_WEAPON_BROKEN_MESSAGE = "That weapon is broken.";

const BOT_WEAPON_NO_USES_MESSAGE = "That weapon has no uses left.";

const BOT_NO_REACTIONS_MESSAGE = "This bot has no Reactions remaining.";

export type BotHandWeapon = {
  itemCharacterId: string;
  displayName: string;
  attackModes: readonly string[];
  attackMeleeBonus: number;
  attackRangeBonus: number;
  maxUses: number | null;
  currentUses: number;
  operational: boolean;
  handEquipped: boolean;
  damage: { numberOfDice: number; diceType: number } | null;
};

type Prepared =
  | {
      ok: true;
      diceExpression: string;
      total: number;
      successes?: number;
      attribution: string;
      metadata: Record<string, unknown>;
      spendUse: boolean;
      spendReaction: boolean;
    }
  | { ok: false; message: string };

function attackMode(attack: BotAttack): "MELEE" | "RANGE" {
  return attack === "attackMelee" ? "MELEE" : "RANGE";
}

function weaponBonus(attack: BotAttack, weapon: BotHandWeapon): number {
  return attack === "attackMelee"
    ? weapon.attackMeleeBonus
    : weapon.attackRangeBonus;
}

function refuseWeapon(
  attack: BotAttack,
  weapon: BotHandWeapon,
  checkUses: boolean
): string | null {
  if (!weapon.handEquipped) return BOT_WEAPON_NOT_IN_HAND_MESSAGE;
  if (!weapon.operational) return BOT_WEAPON_BROKEN_MESSAGE;
  if (checkUses && weapon.maxUses != null && weapon.currentUses <= 0) {
    return BOT_WEAPON_NO_USES_MESSAGE;
  }
  if (!weapon.attackModes.includes(attackMode(attack))) {
    return BOT_WEAPON_NOT_IN_HAND_MESSAGE;
  }
  return null;
}

function openWeaponName(attack: BotAttack): string {
  return attack === "attackMelee" ? "Unarmed" : "Improvised weapon";
}

export function prepareBotCombatRoll(input: {
  holding: BotHolding;
  combat: BotCombatValue;
  roll: "attack" | "damage" | "defence";
  weapon: BotHandWeapon | null;
  extraDice: number;
  results: number[];
  isPrivate: boolean;
  rollerName: string;
}): Prepared {
  const blocked = botRollBlockedMessage(input.holding);
  if (blocked != null) return { ok: false, message: blocked };

  const stats: BotCombatStats = input.holding.combat;
  const label = BOT_COMBAT_LABELS[input.combat];

  if (input.roll === "defence") {
    if (isBotAttack(input.combat)) {
      return { ok: false, message: "That is not a bot defence." };
    }
    if (input.holding.reactionsRemaining <= 0) {
      return { ok: false, message: BOT_NO_REACTIONS_MESSAGE };
    }
    const pool = botDefencePool(
      stats,
      input.holding.attributes,
      input.combat as BotDefence
    );
    const count = botAttributeDiceCount(pool, input.extraDice);
    if (count === 0) {
      return {
        ok: false,
        message: "A bot defence roll needs at least one die.",
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
      spendUse: false,
      spendReaction: true,
      metadata: {
        label1: label,
        botCombat: input.combat,
        botCharacterId: input.holding.id,
        botDisplayName: input.holding.displayName,
        extraDice: input.extraDice,
        baseDice: pool,
      },
    };
  }

  if (!isBotAttack(input.combat)) {
    return { ok: false, message: "That is not a bot attack." };
  }
  const attack = input.combat;

  if (input.weapon != null) {
    const refusal = refuseWeapon(attack, input.weapon, input.roll === "attack");
    if (refusal != null) return { ok: false, message: refusal };
  }

  const weaponName = input.weapon?.displayName ?? openWeaponName(attack);
  const bonus = input.weapon == null ? 0 : weaponBonus(attack, input.weapon);

  if (input.roll === "damage") {
    const damage =
      input.weapon == null
        ? { numberOfDice: 1, diceType: 4 }
        : input.weapon.damage;
    const base = damage?.numberOfDice ?? 0;
    const sides = damage?.diceType ?? 4;
    const count = botAttributeDiceCount(base, input.extraDice);
    if (count === 0) {
      return {
        ok: false,
        message: "A bot damage roll needs at least one die.",
      };
    }
    if (input.results.length !== count) {
      return {
        ok: false,
        message: "Dice count does not match the pool plus extra dice.",
      };
    }
    const total = input.results.reduce((sum, face) => sum + face, 0);
    return {
      ok: true,
      diceExpression: `${count}d${sides}`,
      total,
      attribution: botRollAttribution({
        isPrivate: input.isPrivate,
        rollerName: input.rollerName,
        botDisplayName: input.holding.displayName,
      }),
      spendUse: false,
      spendReaction: false,
      metadata: {
        label1: label,
        botCombat: input.combat,
        botCharacterId: input.holding.id,
        botDisplayName: input.holding.displayName,
        weaponName,
        extraDice: input.extraDice,
        baseDice: base,
        ...(input.weapon
          ? { itemCharacterId: input.weapon.itemCharacterId }
          : {}),
      },
    };
  }

  const pool = botAttackPool(stats, input.holding.attributes, attack, bonus);
  const count = botAttributeDiceCount(pool, input.extraDice);
  if (count === 0) {
    return {
      ok: false,
      message: "A bot attack roll needs at least one die.",
    };
  }
  if (input.results.length !== count) {
    return {
      ok: false,
      message: "Dice count does not match the pool plus extra dice.",
    };
  }
  const successes = input.results.filter(isBotAttributeSuccess).length;
  const spendsUse = input.weapon?.maxUses != null;
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
    spendUse: spendsUse,
    spendReaction: false,
    metadata: {
      label1: label,
      botCombat: input.combat,
      botCharacterId: input.holding.id,
      botDisplayName: input.holding.displayName,
      weaponName,
      extraDice: input.extraDice,
      baseDice: pool,
      ...(input.weapon
        ? { itemCharacterId: input.weapon.itemCharacterId }
        : {}),
    },
  };
}
