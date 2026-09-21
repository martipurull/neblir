import type { CataloguePromotionSuccess } from "@/lib/api/cataloguePromotions";
import { useState } from "react";

export function useCataloguePromotionSuccess() {
  const [promotionSuccess, onPromoted] =
    useState<CataloguePromotionSuccess | null>(null);
  return { promotionSuccess, onPromoted };
}
