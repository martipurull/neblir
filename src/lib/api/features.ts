import {
  featureCatalogueListResponseSchema,
  featureCatalogueResponseSchema,
  type FeatureCatalogueResponse,
} from "@/app/lib/types/featureCatalogue";
import { readApiErrorBody, responseShapeError } from "@/lib/api/responseShape";
import { getUserSafeApiError } from "@/lib/userSafeError";

export async function getCatalogueFeatures(): Promise<
  FeatureCatalogueResponse[]
> {
  const response = await fetch("/api/features", { method: "GET" });
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to fetch features"
      )
    );
  }

  const parsed = featureCatalogueListResponseSchema.safeParse(
    await response.json()
  );
  if (!parsed.success) {
    throw responseShapeError("Features", parsed.error);
  }
  return parsed.data;
}

export async function getCatalogueFeature(
  id: string
): Promise<FeatureCatalogueResponse> {
  const response = await fetch(`/api/features/${encodeURIComponent(id)}`, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to fetch feature"
      )
    );
  }

  const parsed = featureCatalogueResponseSchema.safeParse(
    await response.json()
  );
  if (!parsed.success) {
    throw responseShapeError("Feature", parsed.error);
  }
  return parsed.data;
}
