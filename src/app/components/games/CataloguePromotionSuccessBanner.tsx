"use client";

import type { CataloguePromotionSuccess } from "@/lib/api/cataloguePromotions";
import Link from "next/link";

export function CataloguePromotionSuccessBanner({
  promotion,
}: {
  promotion: CataloguePromotionSuccess;
}) {
  return (
    <div
      role="status"
      className="rounded-md border border-neblirSafe-400 bg-neblirSafe-200/30 px-3 py-2"
    >
      <p className="text-sm text-neblirSafe-600">
        Promoted “{promotion.name}” to Official.{" "}
        <Link
          href={promotion.editHref}
          className="font-semibold underline underline-offset-2 hover:text-neblirSafe"
        >
          Edit Official {promotion.catalogueDomain}
        </Link>
      </p>
    </div>
  );
}
