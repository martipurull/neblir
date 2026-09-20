import {
  officialCatalogueEditPath,
  type PromotableCatalogueDomain,
} from "@/app/lib/types/cataloguePromotion";
import type { ItemDamage } from "@/app/lib/types/item";
import { getUserSafeApiError } from "@/lib/userSafeError";
import { z } from "zod";

type ApiErrorPayload = { message?: string; details?: string };

const cataloguePromotionResponseSchema = z.object({
  catalogueDomain: z.enum(["items", "vehicles", "enemies"]),
  official: z.object({
    id: z.string(),
    name: z.string().optional().nullable(),
  }),
});

export type CataloguePromotionSuccess = {
  catalogueDomain: PromotableCatalogueDomain;
  officialId: string;
  name: string;
  editHref: string;
};

export type PromoteCustomTemplateInput = {
  catalogueDomain: PromotableCatalogueDomain;
  customId: string;
  accessType?: "PLAYER" | "GAME_MASTER";
  confCost?: number;
  description?: string;
  usage?: string;
  damage?: ItemDamage;
};

export async function promoteCustomTemplate(
  gameId: string,
  body: PromoteCustomTemplateInput
): Promise<CataloguePromotionSuccess> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/catalogue-promotions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  let json: unknown = {};
  try {
    json = await response.json();
  } catch {
    // ignore
  }

  if (!response.ok) {
    const payload = json as ApiErrorPayload;
    throw new Error(
      getUserSafeApiError(response.status, payload, "Failed to promote")
    );
  }

  const parsed = cataloguePromotionResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Promotion response did not match expected shape");
  }

  const trimmedName = parsed.data.official.name?.trim() ?? "";
  const name = trimmedName === "" ? "Official catalogue row" : trimmedName;
  return {
    catalogueDomain: parsed.data.catalogueDomain,
    officialId: parsed.data.official.id,
    name,
    editHref: officialCatalogueEditPath(
      parsed.data.catalogueDomain,
      parsed.data.official.id
    ),
  };
}
