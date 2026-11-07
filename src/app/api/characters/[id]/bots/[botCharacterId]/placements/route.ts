import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import { userHasPlayControl } from "@/app/lib/prisma/gameCharacter";
import { prisma } from "@/app/lib/prisma/client";
import {
  type CharacterForCombatSync,
  computeCombatInfoUpdateForCharacter,
} from "@/app/lib/equipCombatUtils";
import { presentBotHolding } from "@/app/lib/botHoldingView";
import {
  getBotCharacterRow,
  resolveHoldingTemplate,
} from "@/app/lib/prisma/botCharacter";
import {
  BotPlacementConflictError,
  placeItemOnBot,
  placementsByHolding,
} from "@/app/lib/prisma/botPlacement";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { placeBotItemSchema } from "@/app/lib/types/bot";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../../../shared/errors";
import { errorResponse } from "../../../../../shared/responses";

async function syncCombatForCharacter(characterId: string) {
  const character = await getCharacter(characterId);
  if (character?.combatInformation) {
    const combatUpdate = computeCombatInfoUpdateForCharacter(
      character as CharacterForCombatSync
    );
    await updateCharacter(characterId, {
      combatInformation: {
        ...character.combatInformation,
        ...combatUpdate,
      },
    });
  }
}

export const POST = auth(async (request: AuthNextRequest, { params }) => {
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

    const parsed = placeBotItemSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const holding = await getBotCharacterRow(characterId, botCharacterId);
    if (!holding) {
      return errorResponse("Bot holding not found for this character", 404);
    }

    const template = await resolveHoldingTemplate(holding);
    if (!template) {
      return errorResponse("Bot not found", 404);
    }

    const itemBefore = await prisma.itemCharacter.findFirst({
      where: { id: parsed.data.itemCharacterId, characterId },
      select: { isEquipped: true, equipSlots: true },
    });

    await placeItemOnBot({
      characterId,
      botCharacterId,
      itemCharacterId: parsed.data.itemCharacterId,
      place: parsed.data.place,
      maxCargoWeightKg: template.maxCargoWeightKg ?? null,
      maxInstalledItems: template.maxInstalledItems ?? null,
    });

    const wasEquipped =
      itemBefore?.isEquipped === true ||
      (itemBefore?.equipSlots?.length ?? 0) > 0;
    if (wasEquipped) {
      await syncCombatForCharacter(characterId);
    }

    const placements = await placementsByHolding(characterId, [botCharacterId]);
    return NextResponse.json(
      presentBotHolding(holding, template, placements.get(botCharacterId)),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof BotPlacementConflictError) {
      return errorResponse(error.message, error.status);
    }
    logger.error({
      method: "POST",
      route: "/api/characters/[id]/bots/[botCharacterId]/placements",
      message: "Error placing an item on a bot",
      error,
    });
    return errorResponse(
      "Error placing an item on a bot",
      500,
      serializeError(error)
    );
  }
});
