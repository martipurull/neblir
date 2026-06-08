import { getImageUrl } from "@/lib/api/image";
import { useEffect, useMemo, useRef, useState } from "react";

type ImageEntry = {
  id: string;
  imageKey?: string | null;
};

type ImageUrlMap = Record<string, string | null>;
const MAX_IMAGE_URL_RETRIES = 3;
const RETRY_DELAY_MS = 500;

export function useImageUrls(entries: ImageEntry[]): ImageUrlMap {
  const [imageUrls, setImageUrls] = useState<ImageUrlMap>({});
  const [resolvedImageKeyById, setResolvedImageKeyById] = useState<
    Record<string, string>
  >({});
  const retryCountByIdRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let isCancelled = false;

    const entriesToFetch = entries.filter((entry) => {
      if (!entry.imageKey) return false;
      const resolvedKey = resolvedImageKeyById[entry.id];
      if (resolvedKey !== entry.imageKey) {
        retryCountByIdRef.current[entry.id] = 0;
        return true;
      }
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
          const imageKey = entry.imageKey as string;
          const nextAttempt = (retryCountByIdRef.current[entry.id] ?? 0) + 1;
          retryCountByIdRef.current[entry.id] = nextAttempt;
          if (nextAttempt > 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, (nextAttempt - 1) * RETRY_DELAY_MS)
            );
          }
          try {
            const url = await getImageUrl(imageKey);
            return { id: entry.id, imageKey, url } as const;
          } catch {
            return { id: entry.id, imageKey, url: null } as const;
          }
        })
      );

      if (isCancelled) {
        return;
      }

      const appliedEntries = resolvedEntries.filter(({ id, imageKey }) => {
        const currentEntry = entries.find((entry) => entry.id === id);
        return currentEntry?.imageKey === imageKey;
      });

      if (appliedEntries.length === 0) {
        return;
      }

      setImageUrls((previous) => ({
        ...previous,
        ...Object.fromEntries(
          appliedEntries.map(({ id, url }) => [id, url] as const)
        ),
      }));
      setResolvedImageKeyById((previous) => ({
        ...previous,
        ...Object.fromEntries(
          appliedEntries.map(({ id, imageKey }) => [id, imageKey] as const)
        ),
      }));
    };

    void resolveImageUrls();

    return () => {
      isCancelled = true;
    };
  }, [entries, imageUrls, resolvedImageKeyById]);

  return useMemo(() => {
    const result: ImageUrlMap = {};
    for (const entry of entries) {
      if (!entry.imageKey) continue;
      if (resolvedImageKeyById[entry.id] !== entry.imageKey) {
        continue;
      }
      if (entry.id in imageUrls) {
        result[entry.id] = imageUrls[entry.id];
      }
    }
    return result;
  }, [entries, imageUrls, resolvedImageKeyById]);
}
