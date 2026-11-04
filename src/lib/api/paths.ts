import { pathListSchema, pathSchema, type Path } from "@/app/lib/types/path";
import { readApiErrorBody, responseShapeError } from "@/lib/api/responseShape";
import { getUserSafeApiError } from "@/lib/userSafeError";

export async function getCataloguePaths(): Promise<Path[]> {
  const response = await fetch("/api/paths", { method: "GET" });
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to fetch paths"
      )
    );
  }

  const parsed = pathListSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Paths", parsed.error);
  }
  return parsed.data;
}

export async function getCataloguePath(id: string): Promise<Path> {
  const response = await fetch(`/api/paths/${encodeURIComponent(id)}`, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to fetch path"
      )
    );
  }

  const parsed = pathSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Path", parsed.error);
  }
  return parsed.data;
}
