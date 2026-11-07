import {
  holdingTrackClamp,
  resolveBotTrackStats,
  uniqueInheritsChangedCeiling,
  type BotHoldingTrackState,
  type BotTrackStats,
} from "@/app/lib/botTracks";
import {
  listBotCharacterRowsByBot,
  updateBotCharacter,
} from "@/app/lib/prisma/botCharacter";
import { listUniqueBotsForTemplate } from "@/app/lib/prisma/uniqueBot";

type TemplateSource = "OFFICIAL" | "CUSTOM";

type ClampRow = {
  id: string;
  sourceType?: string | null;
} & Partial<BotHoldingTrackState>;

function isDirectHolding(row: ClampRow, sourceType: TemplateSource): boolean {
  if (sourceType === "CUSTOM") return row.sourceType === "CUSTOM";
  return (row.sourceType ?? "OFFICIAL") === "OFFICIAL";
}

/** Writes the ceiling clamp, plus any extra holding fields, in one update. */
export async function persistHoldingTrackClamp(
  row: { id: string } & Partial<BotHoldingTrackState>,
  stats: Partial<BotTrackStats> | null | undefined,
  extra: { currentHp?: number } = {}
): Promise<void> {
  const data = { ...holdingTrackClamp(row, stats), ...extra };
  if (Object.keys(data).length === 0) return;
  await updateBotCharacter(row.id, data);
}

/**
 * Pulls direct holdings and inheriting Unique holdings back inside the
 * template ceilings that just changed. A Unique that overrides a changed
 * ceiling is left alone.
 */
export async function clampHoldingsToTemplateCeilings(args: {
  templateId: string;
  sourceType: TemplateSource;
  stats: BotTrackStats;
  patch: Partial<BotTrackStats>;
  directHoldings: ClampRow[];
}): Promise<void> {
  await Promise.all(
    args.directHoldings
      .filter((row) => isDirectHolding(row, args.sourceType))
      .map((row) => persistHoldingTrackClamp(row, args.stats))
  );
  const uniques = await listUniqueBotsForTemplate(
    args.sourceType,
    args.templateId
  );
  for (const unique of uniques) {
    if (!uniqueInheritsChangedCeiling(unique, args.patch)) continue;
    const uniqueHoldings = await listBotCharacterRowsByBot(unique.id);
    await Promise.all(
      uniqueHoldings
        .filter((row) => row.sourceType === "UNIQUE")
        .map((row) =>
          persistHoldingTrackClamp(
            row,
            resolveBotTrackStats(unique, args.stats)
          )
        )
    );
  }
}
