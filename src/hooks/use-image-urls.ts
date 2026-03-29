import { getImageUrl } from "@/lib/api/image";
import { useEffect, useRef, useState } from "react";

type ImageEntry = {
  id: string;
  imageKey?: string | null;
};

type ImageUrlMap = Record<string, string | null>;

export function useImageUrls(entries: ImageEntry[]): ImageUrlMap {
  const [imageUrls, setImageUrls] = useState<ImageUrlMap>({});
  const retryCountByIdRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let isCancelled = false;

    const entriesToFetch = entries.filter((entry) => {
      if (!entry.imageKey) return false;
      if (imageUrls[entry.id] === undefined) return true;
      // Currency icon fetches can intermittently fail; retry a couple of times.
      if (
        imageUrls[entry.id] === null &&
        entry.imageKey.startsWith("currency-") &&
        (retryCountByIdRef.current[entry.id] ?? 0) < 2
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
          retryCountByIdRef.current[entry.id] =
            (retryCountByIdRef.current[entry.id] ?? 0) + 1;
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
