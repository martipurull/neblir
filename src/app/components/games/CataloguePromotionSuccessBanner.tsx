"use client";

import type { CataloguePromotionSuccess } from "@/lib/api/cataloguePromotions";
import Link from "next/link";

export function CataloguePromotionSuccessCopy({
  promotion,
  variant,
}: {
  promotion: CataloguePromotionSuccess;
  variant: "page" | "modal";
}) {
  const textClassName =
    variant === "page"
      ? "text-sm text-neblirSafe-600"
      : "text-sm text-neblirSafe-400";
  const linkClassName =
    variant === "page"
      ? "font-semibold underline underline-offset-2 hover:text-neblirSafe"
      : "font-semibold text-paleBlue underline underline-offset-2";

  return (
    <p className={textClassName}>
      Promoted “{promotion.name}” to Official.{" "}
      <Link href={promotion.editHref} className={linkClassName}>
        Edit Official {promotion.catalogueDomain}
      </Link>
    </p>
  );
}

export function CataloguePromotionSuccessBanner({
  promotion,
}: {
  promotion: CataloguePromotionSuccess | null;
}) {
  if (!promotion) return null;
  return (
    <div
      role="status"
      className="rounded-md border border-neblirSafe-400 bg-neblirSafe-200/30 px-3 py-2"
    >
      <CataloguePromotionSuccessCopy promotion={promotion} variant="page" />
    </div>
  );
}
