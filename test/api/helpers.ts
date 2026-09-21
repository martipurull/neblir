import { vi } from "vitest";

export async function invokeRoute(
  handler: (...args: any[]) => any,
  ...args: any[]
): Promise<Response> {
  return handler(...args);
}

export function makeAuthedRequest(body?: unknown, userId = "user-1") {
  return {
    auth: { user: { id: userId } },
    json: vi.fn().mockResolvedValue(body),
  } as any;
}

export function makeUnauthedRequest(body?: unknown) {
  return {
    auth: null,
    json: vi.fn().mockResolvedValue(body),
  } as any;
}

export function makeParams<T extends Record<string, string>>(params: T) {
  return { params: Promise.resolve(params) } as any;
}

/** GET handlers that read `new URL(request.url)` (e.g. search params). */
export function makeAuthedRequestWithUrl(
  url: string,
  userId = "user-1",
  body?: unknown
) {
  return {
    auth: { user: { id: userId } },
    url,
    json: vi.fn().mockResolvedValue(body),
  } as any;
}

/** Machine-door GET handlers that read `request.headers` and `request.url`. */
export function makeRequestWithUrlAndHeaders(
  url: string,
  headers: Record<string, string>,
  extra?: { auth?: { user: { id: string } } | null }
) {
  return {
    auth: extra?.auth ?? null,
    url,
    headers: new Headers(headers),
    json: vi.fn(),
  } as any;
}

/** Env / catalogue R2 vars used by image upload and image-url route tests. */
export function setEnvR2() {
  process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
  process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY = "ak";
  process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY = "sk";
  process.env.R2_NEBLIR_BUCKET_NAME = "bucket";
}

export function setCatalogueR2() {
  process.env.R2_NEBLIR_ACCOUNT_ID = "acc";
  process.env.R2_NEBLIR_CATALOGUE_BUCKET_NAME = "neblir-catalogue";
  process.env.R2_NEBLIR_CATALOGUE_BUCKET_ACCESS_KEY = "cat-ak";
  process.env.R2_NEBLIR_CATALOGUE_BUCKET_SECRET_ACCESS_KEY = "cat-sk";
}

export function clearCatalogueR2() {
  delete process.env.R2_NEBLIR_CATALOGUE_BUCKET_NAME;
  delete process.env.R2_NEBLIR_CATALOGUE_BUCKET_ACCESS_KEY;
  delete process.env.R2_NEBLIR_CATALOGUE_BUCKET_SECRET_ACCESS_KEY;
}

/** POST handlers that read `request.formData()` (e.g. CSV import). */
export function makeAuthedFormDataRequest(
  formData: FormData,
  userId = "user-1"
) {
  return {
    auth: { user: { id: userId } },
    formData: vi.fn().mockResolvedValue(formData),
  } as any;
}
