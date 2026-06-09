import { getImageUrl } from "@/lib/api/image";
import { SIGNED_IMAGE_URL_REFRESH_AFTER_MS } from "@/lib/signedImageUrl";
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
  const resolvedAtByIdRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let isCancelled = false;

    const entriesToFetch = entries.filter((entry) => {
      if (!entry.imageKey) return false;
      const resolvedKey = resolvedImageKeyById[entry.id];
      if (resolvedKey !== entry.imageKey) {
        retryCountByIdRef.current[entry.id] = 0;
        return true;
      }
      const resolvedAt = resolvedAtByIdRef.current[entry.id] ?? 0;
      if (
        resolvedAt > 0 &&
        Date.now() - resolvedAt >= SIGNED_IMAGE_URL_REFRESH_AFTER_MS
      ) {
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

      const now = Date.now();
      for (const { id } of appliedEntries) {
        resolvedAtByIdRef.current[id] = now;
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

  // Proactive refresh while the tab stays open on a long-lived SPA session.
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const staleIds = entries
        .filter((entry) => {
          if (!entry.imageKey) return false;
          if (resolvedImageKeyById[entry.id] !== entry.imageKey) return false;
          const resolvedAt = resolvedAtByIdRef.current[entry.id] ?? 0;
          return (
            resolvedAt > 0 &&
            Date.now() - resolvedAt >= SIGNED_IMAGE_URL_REFRESH_AFTER_MS
          );
        })
        .map((entry) => entry.id);

      if (staleIds.length === 0) return;

      for (const id of staleIds) {
        retryCountByIdRef.current[id] = 0;
        delete resolvedAtByIdRef.current[id];
      }

      setResolvedImageKeyById((previous) => {
        const next = { ...previous };
        for (const id of staleIds) {
          delete next[id];
        }
        return next;
      });
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [entries, resolvedImageKeyById]);

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
