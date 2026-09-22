import type { CatalogueSyncApplyResult } from "@/app/lib/catalogueSyncApply";
import type { CatalogueSyncPreviewResponse } from "@/app/lib/catalogueSyncDiff";
import type { CatalogueEnvironment } from "@/app/lib/catalogueSyncEnv";
import {
  getUserSafeApiError,
  getUserSafeErrorMessage,
} from "@/lib/userSafeError";

async function catalogueSyncJson<T>(
  res: Response,
  fallback: string
): Promise<T> {
  const body = (await res.json().catch(() => undefined)) as
    | (T & { message?: string })
    | undefined;
  if (!res.ok) {
    const fromBody =
      typeof body?.message === "string" ? body.message : fallback;
    throw new Error(
      res.status >= 500
        ? getUserSafeErrorMessage(fromBody, fallback)
        : getUserSafeApiError(res.status, body, fallback)
    );
  }
  return body as T;
}

export async function fetchCatalogueSyncPreview(
  source: CatalogueEnvironment,
  dest: CatalogueEnvironment,
  options?: { deleteDestOnly?: boolean }
): Promise<CatalogueSyncPreviewResponse> {
  const params = new URLSearchParams({ source, dest });
  if (options?.deleteDestOnly) {
    params.set("deleteDestOnly", "true");
  }
  const res = await fetch(`/api/staff/catalogue-sync?${params.toString()}`);
  return catalogueSyncJson<CatalogueSyncPreviewResponse>(
    res,
    "Failed to preview Catalogue sync."
  );
}

export async function postCatalogueSyncApply(
  source: CatalogueEnvironment,
  dest: CatalogueEnvironment,
  options?: { deleteDestOnly?: boolean }
): Promise<CatalogueSyncApplyResult> {
  const res = await fetch("/api/staff/catalogue-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source,
      dest,
      deleteDestOnly: options?.deleteDestOnly === true,
    }),
  });
  return catalogueSyncJson<CatalogueSyncApplyResult>(
    res,
    "Failed to apply Catalogue sync."
  );
}
