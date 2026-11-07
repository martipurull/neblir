import {
  botCargoCapacityMessage,
  parseBotItemLocation,
} from "@/app/lib/constants/inventory";
import { botHoldingSource } from "@/app/lib/botHoldingView";
import { prisma } from "./client";
import { resolveUniqueBotTemplate } from "./uniqueBot";

type CargoQuantityRow = {
  id?: string;
  quantity?: number;
  itemLocation?: string | null;
  item?: { weight?: number | null } | null;
};

/** A set cargo max refuses a bigger stack. An unset max does not cap. */
export async function botCargoQuantityRefusal(args: {
  characterId: string;
  itemCharacterId: string;
  nextQuantity: number;
  inventory: CargoQuantityRow[];
}): Promise<string | null> {
  const row = args.inventory.find((entry) => entry.id === args.itemCharacterId);
  const place = parseBotItemLocation(row?.itemLocation);
  if (place?.place !== "cargo") return null;

  const holding = await prisma.botCharacter.findFirst({
    where: { id: place.botCharacterId, characterId: args.characterId },
  });
  if (!holding) return null;

  const source = botHoldingSource(holding);
  const maxCargoWeightKg =
    source === "CUSTOM"
      ? ((await prisma.customBot.findUnique({ where: { id: holding.botId } }))
          ?.maxCargoWeightKg ?? null)
      : source === "UNIQUE"
        ? ((await resolveUniqueBotTemplate(holding.botId))?.maxCargoWeightKg ??
          null)
        : ((await prisma.bot.findUnique({ where: { id: holding.botId } }))
            ?.maxCargoWeightKg ?? null);
  if (maxCargoWeightKg == null) return null;

  let nextWeight = 0;
  for (const entry of args.inventory) {
    const parsed = parseBotItemLocation(entry.itemLocation);
    if (
      parsed?.botCharacterId !== place.botCharacterId ||
      parsed.place !== "cargo"
    ) {
      continue;
    }
    const quantity =
      entry.id === args.itemCharacterId
        ? args.nextQuantity
        : (entry.quantity ?? 1);
    nextWeight += quantity * (entry.item?.weight ?? 0);
  }
  if (nextWeight > maxCargoWeightKg + 1e-9) {
    return botCargoCapacityMessage(maxCargoWeightKg);
  }
  return null;
}
