import { useImageUrls } from "@/hooks/use-image-urls";
import { useMemo } from "react";

/**
 * Resolves a signed URL for an uploaded image key (e.g. dropzone previews).
 * Returns `undefined` while loading, `null` when unavailable, or the URL string.
 */
export function useImageUploadPreviewUrl(
  imageKey: string,
  previewId = "image-upload-preview"
): string | null | undefined {
  const entries = useMemo(
    () => (imageKey ? [{ id: previewId, imageKey }] : []),
    [imageKey, previewId]
  );
  const imageUrls = useImageUrls(entries);
  if (!imageKey) return null;
  return imageUrls[previewId];
}
