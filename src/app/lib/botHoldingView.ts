import { presentBotActionRolls, readBotActionList } from "@/app/lib/botActions";
import { BOT_DAMAGE_PROFILE } from "@/app/lib/botDamageProfile";
import { botEffectiveMaxCarry, botSpeedFromLoad } from "@/app/lib/botCarry";
import {
  readBotCombatStats,
  reactionsRemainingForCap,
  type BotCombatStats,
} from "@/app/lib/botCombat";
import {
  presentBotTracks,
  type BotHoldingTrackState,
  type BotTrackStats,
} from "@/app/lib/botTracks";
import type { BotAction } from "@/app/lib/types/botAction";
import type {
  BotHolding,
  BotPlacementSummary,
  BotPlacedItem,
  OfficialBot,
} from "@/app/lib/types/bot";

/** Template fields a holding displays. Official bots also carry an access type. */
export type BotTemplateView = BotTrackStats &
  BotCombatStats & {
    id: string;
    name: string;
    imageKey?: string | null;
    description?: string | null;
    confCost?: number | null;
    usage?: string | null;
    notes?: string | null;
    maxHp: number;
    accessType?: OfficialBot["accessType"] | null;
    /** Unset means cargo is not capped. */
    maxCargoWeightKg?: number | null;
    /** Unset means installed hardware is not capped. */
    maxInstalledItems?: number | null;
    /** Movement speed in metres, before carry load. */
    speed?: number | null;
    /** Base max carry weight in kilograms. */
    maxCarryWeight?: number | null;
    /** Descriptive height in metres. */
    heightMetres?: number | null;
    /** Descriptive weight in kilograms. Does not encumber the holding character. */
    weight?: number | null;
    /** Unique bot's game. Absent on Official and Custom templates. */
    gameId?: string | null;
    /** User who minted a Unique bot. */
    ownerUserId?: string | null;
    actions?: unknown;
    additionalActions?: unknown;
  };

export const BOT_HP_OUT_OF_RANGE_MESSAGE =
  "Current HP must stay from 0 through the effective max.";

export const BOT_EFFECTIVE_MAX_BELOW_ZERO_MESSAGE =
  "Effective max HP must be at least 0.";

export type BotHoldingRow = {
  id: string;
  characterId: string;
  botId: string;
  /** Missing on holdings created before Custom bots. Those are Official. */
  sourceType?: "OFFICIAL" | "CUSTOM" | "UNIQUE" | null;
  customName: string | null;
  currentHp: number;
  maxHpBonus: number;
  notes: string | null;
  reactionsRemaining?: number;
} & Partial<BotHoldingTrackState>;

export type BotHoldingSource = "OFFICIAL" | "CUSTOM" | "UNIQUE";

export function botHoldingSource(
  row: Pick<BotHoldingRow, "sourceType">
): BotHoldingSource {
  if (row.sourceType === "CUSTOM") return "CUSTOM";
  if (row.sourceType === "UNIQUE") return "UNIQUE";
  return "OFFICIAL";
}

export function missingBotTemplateMessage(source: BotHoldingSource): string {
  if (source === "CUSTOM") return "Custom bot not found";
  if (source === "UNIQUE") return "Unique bot not found";
  return "Official bot not found";
}

/** Official bots keep their access type. Custom bots expose the shared frame only. */
function projectHoldingBot(bot: BotTemplateView | null): BotHolding["bot"] {
  if (bot == null) return null;
  if (bot.accessType) {
    return {
      id: bot.id,
      name: bot.name,
      imageKey: bot.imageKey ?? null,
      description: bot.description ?? null,
      confCost: bot.confCost ?? null,
      usage: bot.usage ?? null,
      notes: bot.notes ?? null,
      maxHp: bot.maxHp,
      accessType: bot.accessType,
    };
  }
  const imageKey = bot.imageKey ?? null;
  return {
    id: bot.id,
    name: bot.name,
    ...(imageKey ? { imageKey } : {}),
    description: bot.description ?? null,
    confCost: bot.confCost ?? null,
    usage: bot.usage ?? null,
    notes: bot.notes ?? null,
    maxHp: bot.maxHp,
  };
}

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

const EMPTY_BOT_PLACEMENTS: BotPlacementSummary = {
  installedItems: [],
  cargoItems: [],
  carriedItems: [],
  installedCount: 0,
  cargoWeightKg: 0,
  carriedWeightKg: 0,
};

export function presentBotHolding(
  row: BotHoldingRow,
  bot: BotTemplateView | null,
  placements: BotPlacementSummary = EMPTY_BOT_PLACEMENTS
): BotHolding {
  const effectiveMaxHp =
    bot == null ? null : effectiveBotMaxHp(bot.maxHp, row.maxHpBonus);
  const combat = readBotCombatStats(bot);
  const tracks = presentBotTracks(bot, row, row.currentHp);
  const placementViews = presentPlacementActions(
    placements,
    tracks.attributes,
    tracks.mayRoll,
    tracks.rollBlockedReason
  );
  return {
    id: row.id,
    characterId: row.characterId,
    botId: row.botId,
    customName: row.customName,
    displayName: botDisplayName(row.customName, bot?.name),
    sourceType: botHoldingSource(row),
    uniqueOwnerUserId: bot?.ownerUserId ?? null,
    gameId: bot?.gameId ?? null,
    currentHp: row.currentHp,
    maxHpBonus: row.maxHpBonus,
    effectiveMaxHp,
    notes: row.notes,
    ...tracks,
    actions: presentBotActionRolls(
      readBotActionList(bot?.actions),
      tracks.attributes,
      tracks.mayRoll,
      tracks.rollBlockedReason
    ),
    additionalActions: presentBotActionRolls(
      readBotActionList(bot?.additionalActions),
      tracks.attributes,
      tracks.mayRoll,
      tracks.rollBlockedReason
    ),
    combat,
    reactionsRemaining: reactionsRemainingForCap(
      row.reactionsRemaining,
      combat.numberOfReactions
    ),
    damageProfile: [...BOT_DAMAGE_PROFILE],
    bot: projectHoldingBot(bot),
    maxCargoWeightKg: bot?.maxCargoWeightKg ?? null,
    maxInstalledItems: bot?.maxInstalledItems ?? null,
    ...placementViews,
    ...botLoadFacts(bot, placementViews),
  };
}

function presentPlacementActions(
  placements: BotPlacementSummary,
  attributes: BotHolding["attributes"],
  mayRoll: boolean,
  rollBlockedReason: BotHolding["rollBlockedReason"]
): BotPlacementSummary {
  const mapList = (
    items: Array<BotPlacedItem & { storedBotActions?: BotAction[] }>,
    include: boolean
  ): BotPlacedItem[] =>
    items.map((item) => {
      const { storedBotActions, ...rest } = item;
      return {
        ...rest,
        botActions: include
          ? presentBotActionRolls(
              storedBotActions ?? [],
              attributes,
              mayRoll,
              rollBlockedReason
            )
          : [],
      };
    });
  return {
    ...placements,
    installedItems: mapList(placements.installedItems, true),
    cargoItems: mapList(placements.cargoItems, false),
    carriedItems: mapList(placements.carriedItems, false),
  };
}

function botLoadFacts(
  bot: BotTemplateView | null,
  placements: BotPlacementSummary
): Pick<
  BotHolding,
  | "speed"
  | "effectiveSpeed"
  | "speedStrikethrough"
  | "maxCarryWeight"
  | "effectiveMaxCarryWeight"
  | "heightMetres"
  | "weight"
> {
  const loadItems = placements.carriedItems.map((item) => ({
    botEquipSlots: item.botEquipSlots,
    itemName: item.item?.name,
  }));
  const maxCarryWeight = bot?.maxCarryWeight ?? 0;
  const effectiveMaxCarryWeight = botEffectiveMaxCarry(
    maxCarryWeight,
    loadItems
  );
  const speed = Math.max(0, bot?.speed ?? 0);
  const { effectiveSpeed, speedStrikethrough } = botSpeedFromLoad(
    speed,
    placements.carriedWeightKg,
    effectiveMaxCarryWeight
  );
  return {
    speed,
    effectiveSpeed,
    speedStrikethrough,
    maxCarryWeight,
    effectiveMaxCarryWeight,
    heightMetres: bot?.heightMetres ?? null,
    weight: bot?.weight ?? null,
  };
}
