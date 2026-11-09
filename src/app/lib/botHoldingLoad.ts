import {
  botHoldingSource,
  missingBotTemplateMessage,
  presentBotHolding,
  type BotTemplateView,
} from "@/app/lib/botHoldingView";
import {
  getBotCharacterById,
  getBotCharacterRow,
  resolveHoldingTemplate,
} from "@/app/lib/prisma/botCharacter";
import type { BotHolding } from "@/app/lib/types/bot";

export type LoadedBotHolding =
  | { ok: true; holding: BotHolding; template: BotTemplateView }
  | { ok: false; message: string };

/**
 * Load a holding and its template for a roll.
 * Pass `characterId` when the holding must belong to that character.
 */
export async function loadPresentedBotHolding(lookup: {
  id: string;
  characterId?: string;
}): Promise<LoadedBotHolding> {
  const row =
    lookup.characterId == null
      ? await getBotCharacterById(lookup.id)
      : await getBotCharacterRow(lookup.characterId, lookup.id);
  if (!row) {
    return { ok: false, message: "Bot holding not found" };
  }
  const template = await resolveHoldingTemplate(row);
  if (!template) {
    return {
      ok: false,
      message: missingBotTemplateMessage(botHoldingSource(row)),
    };
  }
  return { ok: true, holding: presentBotHolding(row, template), template };
}
