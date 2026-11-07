import { BOT_DAMAGE_PROFILE } from "@/app/lib/botDamageProfile";
import type { BotHolding, OfficialBot } from "@/app/lib/types/bot";

export const BOT_HP_OUT_OF_RANGE_MESSAGE =
  "Current HP must stay from 0 through the effective max.";

export const BOT_EFFECTIVE_MAX_BELOW_ZERO_MESSAGE =
  "Effective max HP must be at least 0.";

export type BotHoldingRow = {
  id: string;
  characterId: string;
  botId: string;
  customName: string | null;
  currentHp: number;
  maxHpBonus: number;
  notes: string | null;
};

export function effectiveBotMaxHp(maxHp: number, maxHpBonus: number): number {
  return maxHp + maxHpBonus;
}

export function botHpIsInsideEffectiveMax(
  currentHp: number,
  effectiveMaxHp: number
): boolean {
  return currentHp >= 0 && currentHp <= effectiveMaxHp;
}

function botDisplayName(
  customName: string | null | undefined,
  templateName: string | null | undefined
): string {
  const nickname = customName?.trim() ?? "";
  if (nickname.length > 0) return nickname;
  const template = templateName?.trim() ?? "";
  return template.length > 0 ? template : "Unknown bot";
}

function botCondition(currentHp: number): BotHolding["condition"] {
  return currentHp <= 0 ? "BROKEN" : "OPERATIONAL";
}

export function presentBotHolding(
  row: BotHoldingRow,
  bot: OfficialBot | null
): BotHolding {
  const effectiveMaxHp =
    bot == null ? null : effectiveBotMaxHp(bot.maxHp, row.maxHpBonus);
  return {
    id: row.id,
    characterId: row.characterId,
    botId: row.botId,
    customName: row.customName,
    displayName: botDisplayName(row.customName, bot?.name),
    currentHp: row.currentHp,
    maxHpBonus: row.maxHpBonus,
    effectiveMaxHp,
    notes: row.notes,
    condition: botCondition(row.currentHp),
    damageProfile: [...BOT_DAMAGE_PROFILE],
    bot,
  };
}
