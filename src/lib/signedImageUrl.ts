/** Must match `expiresIn` on `/api/image-url` presigned GET URLs. */
export const SIGNED_IMAGE_URL_EXPIRES_IN_SECONDS = 3600;

/** Refresh signed URLs proactively before they expire (SPA sessions). */
export const SIGNED_IMAGE_URL_REFRESH_AFTER_MS = 50 * 60 * 1000;
