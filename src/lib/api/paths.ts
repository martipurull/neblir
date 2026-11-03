import { pathListSchema, pathSchema, type Path } from "@/app/lib/types/path";
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

export async function getCataloguePaths(): Promise<Path[]> {
  const response = await fetch("/api/paths", { method: "GET" });
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to fetch paths"
      )
    );
  }

  const parsed = pathListSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw shapeError("Paths", parsed.error.issues);
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
        await readErrorBody(response),
        "Failed to fetch path"
      )
    );
  }

  const parsed = pathSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw shapeError("Path", parsed.error.issues);
  }
  return parsed.data;
}
