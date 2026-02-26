import { getImageUrl } from "@/lib/api/image";
import { useEffect, useState } from "react";

type ImageEntry = {
  id: string;
  imageKey?: string | null;
};

type ImageUrlMap = Record<string, string | null>;

export function useImageUrls(entries: ImageEntry[]): ImageUrlMap {
  const [imageUrls, setImageUrls] = useState<ImageUrlMap>({});

  useEffect(() => {
    let isCancelled = false;

    const entriesToFetch = entries.filter(
      (entry) => entry.imageKey && imageUrls[entry.id] === undefined
    );

    if (entriesToFetch.length === 0) {
      return;
    }

    const resolveImageUrls = async () => {
      const resolvedEntries = await Promise.all(
        entriesToFetch.map(async (entry) => {
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
