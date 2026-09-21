import { createHash, timingSafeEqual } from "node:crypto";

const BEARER_PREFIX = "Bearer ";

export function catalogueSyncPullSecretFromEnv(): string | undefined {
  const secret = process.env.CATALOGUE_SYNC_PULL_SECRET?.trim();
  if (!secret) return undefined;
  return secret;
}

export function authorizationBearerToken(
  authorizationHeader: string | null
): string | undefined {
  if (!authorizationHeader) return undefined;
  if (!authorizationHeader.startsWith(BEARER_PREFIX)) return undefined;
  const token = authorizationHeader.slice(BEARER_PREFIX.length).trim();
  if (!token) return undefined;
  return token;
}

/** Compare provided vs expected secrets without leaking length via early return. */
export function catalogueSyncPullSecretsMatch(
  provided: string,
  expected: string
): boolean {
  const providedDigest = createHash("sha256").update(provided).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(providedDigest, expectedDigest);
}
