import { botHoldingSource, type BotHoldingRow } from "@/app/lib/botHoldingView";
import { prisma } from "./client";
import {
  BOT_HOLDING_MOVE_BLOCKED_MESSAGE,
  botHoldingHasPlacements,
  BotPlacementConflictError,
} from "./botPlacement";
import { moveBotCharacter } from "./botCharacter";
import { getCustomBot } from "./customBot";
import { getUniqueBot } from "./uniqueBot";
import {
  characterIsInGame,
  charactersShareAnyGame,
  viewerCanGiveItemToRecipient,
} from "./gameCharacter";

export async function validateBotHoldingTransfer(
  fromCharacterId: string,
  toCharacterId: string,
  viewerUserId: string,
  holding: BotHoldingRow
): Promise<{ message: string; status: number } | null> {
  if (fromCharacterId === toCharacterId) {
    return {
      message: "Cannot give a bot to the same character",
      status: 400,
    };
  }

  const recipientExists = await prisma.character.findUnique({
    where: { id: toCharacterId },
    select: { id: true },
  });
  if (!recipientExists) {
    return { message: "Recipient character not found", status: 404 };
  }

  if (botHoldingSource(holding) === "UNIQUE") {
    const unique = await getUniqueBot(holding.botId);
    if (!unique) {
      return { message: "Unique bot not found", status: 404 };
    }
    const [fromInGame, toInGame] = await Promise.all([
      characterIsInGame(unique.gameId, fromCharacterId),
      characterIsInGame(unique.gameId, toCharacterId),
    ]);
    if (!fromInGame || !toInGame) {
      return {
        message:
          "That bot can only be given to another character in the same game",
        status: 403,
      };
    }
    if (
      !(await viewerCanGiveItemToRecipient(
        viewerUserId,
        fromCharacterId,
        toCharacterId,
        { restrictGameId: unique.gameId }
      ))
    ) {
      return {
        message: "You cannot give a bot to that character",
        status: 403,
      };
    }
    return null;
  }

  if (botHoldingSource(holding) === "CUSTOM") {
    const custom = await getCustomBot(holding.botId);
    if (!custom) {
      return { message: "Custom bot not found", status: 404 };
    }
    const [fromInGame, toInGame] = await Promise.all([
      characterIsInGame(custom.gameId, fromCharacterId),
      characterIsInGame(custom.gameId, toCharacterId),
    ]);
    if (!fromInGame || !toInGame) {
      return {
        message:
          "That bot can only be given to another character in the same custom-bot game",
        status: 403,
      };
    }
    if (
      !(await viewerCanGiveItemToRecipient(
        viewerUserId,
        fromCharacterId,
        toCharacterId,
        { restrictGameId: custom.gameId }
      ))
    ) {
      return {
        message: "You cannot give a bot to that character",
        status: 403,
      };
    }
    return null;
  }

  const share = await charactersShareAnyGame(fromCharacterId, toCharacterId);
  if (!share) {
    return {
      message:
        "Recipient must be in a game that this character is registered for",
      status: 403,
    };
  }

  if (
    !(await viewerCanGiveItemToRecipient(
      viewerUserId,
      fromCharacterId,
      toCharacterId
    ))
  ) {
    return {
      message: "You cannot give a bot to that character",
      status: 403,
    };
  }

  return null;
}

export async function performBotHoldingTransfer(args: {
  fromCharacterId: string;
  toCharacterId: string;
  botCharacterId: string;
}): Promise<void> {
  if (
    await botHoldingHasPlacements(args.fromCharacterId, args.botCharacterId)
  ) {
    throw new BotPlacementConflictError(BOT_HOLDING_MOVE_BLOCKED_MESSAGE);
  }
  await moveBotCharacter(args.botCharacterId, args.toCharacterId);
}
