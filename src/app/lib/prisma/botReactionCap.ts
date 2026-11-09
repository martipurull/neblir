import {
  DEFAULT_BOT_REACTION_CAP,
  reactionsRemainingForCap,
} from "@/app/lib/botCombat";
import { botHoldingSource } from "@/app/lib/botHoldingView";
import {
  listBotCharacterRowsByBot,
  updateBotCharacter,
} from "@/app/lib/prisma/botCharacter";
import { listUniqueBotsForTemplate } from "@/app/lib/prisma/uniqueBot";

async function dropRemaining(
  rows: Array<{ id: string; reactionsRemaining?: number | null }>,
  nextCap: number
): Promise<void> {
  await Promise.all(
    rows.map(async (row) => {
      const baseline = row.reactionsRemaining ?? DEFAULT_BOT_REACTION_CAP;
      const next = reactionsRemainingForCap(row.reactionsRemaining, nextCap);
      if (next >= baseline) return;
      await updateBotCharacter(row.id, { reactionsRemaining: next });
    })
  );
}

/** Direct holdings, and Unique holdings that still inherit this cap. */
export async function clampTemplateReactionCap(args: {
  templateId: string;
  sourceType: "OFFICIAL" | "CUSTOM";
  nextCap: number;
}): Promise<void> {
  const direct = await listBotCharacterRowsByBot(args.templateId);
  await dropRemaining(
    direct.filter((row) => botHoldingSource(row) === args.sourceType),
    args.nextCap
  );
  const uniques = await listUniqueBotsForTemplate(
    args.sourceType,
    args.templateId
  );
  for (const unique of uniques) {
    if (unique.numberOfReactionsOverride != null) continue;
    const holdings = await listBotCharacterRowsByBot(unique.id);
    await dropRemaining(
      holdings.filter((row) => row.sourceType === "UNIQUE"),
      args.nextCap
    );
  }
}

export async function clampUniqueReactionCap(
  uniqueId: string,
  nextCap: number
): Promise<void> {
  const holdings = await listBotCharacterRowsByBot(uniqueId);
  await dropRemaining(
    holdings.filter((row) => row.sourceType === "UNIQUE"),
    nextCap
  );
}
