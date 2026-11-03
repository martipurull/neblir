import {
  featureCatalogueListResponseSchema,
  featureCatalogueResponseSchema,
  type FeatureCatalogueResponse,
} from "@/app/lib/types/featureCatalogue";
import { getUserSafeApiError } from "@/lib/userSafeError";

type ApiErrorPayload = { message?: string; details?: string };

async function readErrorBody(
  response: Response
): Promise<ApiErrorPayload | undefined> {
  try {
    return (await response.json()) as ApiErrorPayload;
  } catch {
    return undefined;
  }
}

function shapeError(
  label: string,
  issues: { path: PropertyKey[]; message: string }[]
) {
  const details = issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  return new Error(
    `${label} response did not match expected shape: ${details}`
  );
}

export async function getCatalogueFeatures(): Promise<
  FeatureCatalogueResponse[]
> {
  const response = await fetch("/api/features", { method: "GET" });
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to fetch features"
      )
    );
  }

  const parsed = featureCatalogueListResponseSchema.safeParse(
    await response.json()
  );
  if (!parsed.success) {
    throw shapeError("Features", parsed.error.issues);
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
        await readErrorBody(response),
        "Failed to fetch feature"
      )
    );
  }

  const parsed = featureCatalogueResponseSchema.safeParse(
    await response.json()
  );
  if (!parsed.success) {
    throw shapeError("Feature", parsed.error.issues);
  }
  return parsed.data;
}
