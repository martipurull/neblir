import { getImageUrl } from "@/lib/api/image";
import { useEffect, useRef, useState } from "react";

type ImageEntry = {
  id: string;
  imageKey?: string | null;
};

type ImageUrlMap = Record<string, string | null>;
const MAX_IMAGE_URL_RETRIES = 3;
const RETRY_DELAY_MS = 500;

export function useImageUrls(entries: ImageEntry[]): ImageUrlMap {
  const [imageUrls, setImageUrls] = useState<ImageUrlMap>({});
  const retryCountByIdRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let isCancelled = false;

    const entriesToFetch = entries.filter((entry) => {
      if (!entry.imageKey) return false;
      if (imageUrls[entry.id] === undefined) return true;
      if (
        imageUrls[entry.id] === null &&
        (retryCountByIdRef.current[entry.id] ?? 0) < MAX_IMAGE_URL_RETRIES
      ) {
        return true;
      }
      return false;
    });

    if (entriesToFetch.length === 0) {
      return;
    }

    const resolveImageUrls = async () => {
      const resolvedEntries = await Promise.all(
        entriesToFetch.map(async (entry) => {
          const nextAttempt = (retryCountByIdRef.current[entry.id] ?? 0) + 1;
          retryCountByIdRef.current[entry.id] = nextAttempt;
          if (nextAttempt > 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, (nextAttempt - 1) * RETRY_DELAY_MS)
            );
          }
          try {
            const url = await getImageUrl(entry.imageKey as string);
            return [entry.id, url] as const;
          } catch {
            return [entry.id, null] as const;
          }
        })
      );

      if (isCancelled) {
        return;
      }

      setImageUrls((previous) => ({
        ...previous,
        ...Object.fromEntries(resolvedEntries),
      }));
    };

    void resolveImageUrls();

    return () => {
      isCancelled = true;
    };
  }, [entries, imageUrls]);

  return imageUrls;
}
