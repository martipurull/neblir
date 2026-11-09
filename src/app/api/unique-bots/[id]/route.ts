import { persistHoldingTrackClamp } from "@/app/lib/botHoldingCeiling";
import { clampUniqueReactionCap } from "@/app/lib/prisma/botReactionCap";
import { effectiveBotMaxHp } from "@/app/lib/botHoldingView";
import { trackCeilingOverridesChanged } from "@/app/lib/botTracks";
import { getBot } from "@/app/lib/prisma/bot";
import { listBotCharacterRowsByBot } from "@/app/lib/prisma/botCharacter";
import { getCustomBot } from "@/app/lib/prisma/customBot";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import {
  getUniqueBot,
  resolveUniqueBotStats,
  updateUniqueBot,
} from "@/app/lib/prisma/uniqueBot";
import { uniqueBotUpdateSchema } from "@/app/lib/types/bot";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) return errorResponse("User ID not found", 400);

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      return errorResponse("Invalid unique bot ID", 400);
    }

    const bot = await getUniqueBot(id);
    if (!bot) return errorResponse("Unique bot not found", 404);

    const game = await getGame(bot.gameId);
    const isMinter = bot.ownerUserId === userId;
    const isGameMaster = game?.gameMaster === userId;
    const inGame = await userIsInGame(bot.gameId, userId);
    if (!isMinter && !isGameMaster && !inGame) {
      return errorResponse("You do not have access to this unique bot.", 403);
    }

    return NextResponse.json(bot);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/unique-bots/[id]",
      message: "Error fetching unique bot",
      error,
    });
    return errorResponse(
      "Error fetching unique bot",
      500,
      serializeError(error)
    );
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) return errorResponse("User ID not found", 400);

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      return errorResponse("Invalid unique bot ID", 400);
    }

    const existing = await getUniqueBot(id);
    if (!existing) return errorResponse("Unique bot not found", 404);
    if (existing.ownerUserId !== userId) {
      return errorResponse(
        "Only the user who minted this unique bot can edit it.",
        403
      );
    }

    const parsed = uniqueBotUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Error parsing unique bot update request",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    if (existing.sourceType === "STANDALONE") {
      if (parsed.data.nameOverride === null) {
        return errorResponse("A standalone bot needs a name.", 400);
      }
      if (parsed.data.maxHpOverride === null) {
        return errorResponse("A standalone bot needs a max HP.", 400);
      }
    }

    const updated = await updateUniqueBot(id, parsed.data);
    const statsChanged =
      parsed.data.maxHpOverride !== undefined ||
      trackCeilingOverridesChanged(parsed.data);
    const reactionCapChanged =
      parsed.data.numberOfReactionsOverride !== undefined;
    if (statsChanged || reactionCapChanged) {
      const templateBot =
        updated.sourceType === "OFFICIAL" && updated.botId
          ? await getBot(updated.botId)
          : updated.sourceType === "CUSTOM" && updated.botId
            ? await getCustomBot(updated.botId)
            : null;
      const stats = resolveUniqueBotStats(updated, templateBot);
      if (reactionCapChanged) {
        await clampUniqueReactionCap(id, stats.numberOfReactions);
      }
      if (statsChanged) {
        const rows = await listBotCharacterRowsByBot(id);
        const holding = rows.find((row) => row.sourceType === "UNIQUE");
        if (holding) {
          const extra: { currentHp?: number } = {};
          if (parsed.data.maxHpOverride !== undefined) {
            const max = Math.max(
              0,
              effectiveBotMaxHp(stats.maxHp, holding.maxHpBonus)
            );
            if (holding.currentHp > max) extra.currentHp = max;
          }
          await persistHoldingTrackClamp(holding, stats, extra);
        }
      }
    }
    return NextResponse.json(updated);
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/unique-bots/[id]",
      message: "Error updating unique bot",
      error,
    });
    return errorResponse(
      "Error updating unique bot",
      500,
      serializeError(error)
    );
  }
});
