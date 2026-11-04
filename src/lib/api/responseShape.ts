import type { ZodError } from "zod";

export type ApiErrorPayload = { message?: string; details?: string };

export async function readApiErrorBody(
  response: Response
): Promise<ApiErrorPayload | undefined> {
  try {
    return (await response.json()) as ApiErrorPayload;
  } catch {
    return undefined;
  }
}

export function responseShapeError(label: string, error: ZodError): Error {
  const details = error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  return new Error(
    `${label} response did not match expected shape: ${details}`
  );
}
