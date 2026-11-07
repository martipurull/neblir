import {
  BOT_EFFECTIVE_MAX_BELOW_ZERO_MESSAGE,
  BOT_HP_OUT_OF_RANGE_MESSAGE,
  botHoldingSource,
  botHpIsInsideEffectiveMax,
  missingBotTemplateMessage,
  effectiveBotMaxHp,
  presentBotHolding,
} from "@/app/lib/botHoldingView";
import { userHasPlayControl } from "@/app/lib/prisma/gameCharacter";
import {
  deleteBotCharacter,
  getBotCharacterRow,
  resolveHoldingTemplate,
  updateBotCharacter,
} from "@/app/lib/prisma/botCharacter";
import {
  BOT_HOLDING_REMOVE_BLOCKED_MESSAGE,
  botHoldingHasPlacements,
  placementsByHolding,
} from "@/app/lib/prisma/botPlacement";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { botHoldingPatchSchema } from "@/app/lib/types/bot";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const { id: characterId, botCharacterId } = (await params) as {
      id: string;
      botCharacterId: string;
    };
    if (
      !characterId ||
      typeof characterId !== "string" ||
      !botCharacterId ||
      typeof botCharacterId !== "string"
    ) {
      return errorResponse("Invalid character or bot holding ID", 400);
    }

    if (!(await userHasPlayControl(characterId, request.auth.user.id))) {
      return errorResponse("This is not one of your characters.", 403);
    }

    const parsed = botHoldingPatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const existing = await getBotCharacterRow(characterId, botCharacterId);
    if (!existing) {
      return errorResponse("Bot holding not found for this character", 404);
    }

    const bot = await resolveHoldingTemplate(existing);
    if (!bot) {
      return errorResponse(
        missingBotTemplateMessage(botHoldingSource(existing)),
        404
      );
    }

    const { action } = parsed.data;
    let updated = existing;

    if (action === "setHp") {
      const max = effectiveBotMaxHp(bot.maxHp, existing.maxHpBonus);
      if (!botHpIsInsideEffectiveMax(parsed.data.currentHp, max)) {
        return errorResponse(BOT_HP_OUT_OF_RANGE_MESSAGE, 400);
      }
      updated = await updateBotCharacter(botCharacterId, {
        currentHp: parsed.data.currentHp,
      });
    } else if (action === "setMaxHpBonus") {
      const max = effectiveBotMaxHp(bot.maxHp, parsed.data.maxHpBonus);
      if (max < 0) {
        return errorResponse(BOT_EFFECTIVE_MAX_BELOW_ZERO_MESSAGE, 400);
      }
      const currentHp = Math.min(existing.currentHp, max);
      updated = await updateBotCharacter(botCharacterId, {
        maxHpBonus: parsed.data.maxHpBonus,
        currentHp,
      });
    } else if (action === "setCustomName") {
      updated = await updateBotCharacter(botCharacterId, {
        customName: blankToNull(parsed.data.customName),
      });
    } else {
      updated = await updateBotCharacter(botCharacterId, {
        notes: blankToNull(parsed.data.notes),
      });
    }

    const placements = await placementsByHolding(characterId, [botCharacterId]);
    return NextResponse.json(
      presentBotHolding(updated, bot, placements.get(botCharacterId))
    );
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/characters/[id]/bots/[botCharacterId]",
      message: "Error updating character bot",
      error,
    });
    return errorResponse(
      "Error updating character bot",
      500,
      serializeError(error)
    );
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const { id: characterId, botCharacterId } = (await params) as {
      id: string;
      botCharacterId: string;
    };
    if (
      !characterId ||
      typeof characterId !== "string" ||
      !botCharacterId ||
      typeof botCharacterId !== "string"
    ) {
      return errorResponse("Invalid character or bot holding ID", 400);
    }

    if (!(await userHasPlayControl(characterId, request.auth.user.id))) {
      return errorResponse("This is not one of your characters.", 403);
    }

    const existing = await getBotCharacterRow(characterId, botCharacterId);
    if (!existing) {
      return errorResponse("Bot holding not found for this character", 404);
    }

    if (await botHoldingHasPlacements(characterId, botCharacterId)) {
      return errorResponse(BOT_HOLDING_REMOVE_BLOCKED_MESSAGE, 409);
    }

    await deleteBotCharacter(botCharacterId);
    return new Response(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/characters/[id]/bots/[botCharacterId]",
      message: "Error removing character bot",
      error,
    });
    return errorResponse(
      "Error removing character bot",
      500,
      serializeError(error)
    );
  }
});
