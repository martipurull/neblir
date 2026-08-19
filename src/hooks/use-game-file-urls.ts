import { getGameFileUrl } from "@/lib/api/gameFiles";
import { useEffect, useState } from "react";

export function useSignedFileUrls(
  ids: string[],
  getUrl: (id: string) => Promise<string>
): Record<string, string | null> {
  const idsKey = ids.join(",");
  const [urls, setUrls] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!idsKey) {
      return;
    }

    let cancelled = false;
    const nextIds = idsKey.split(",").filter(Boolean);

    void Promise.all(
      nextIds.map(async (id) => {
        try {
          const url = await getUrl(id);
          return [id, url] as const;
        } catch {
          return [id, null] as const;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setUrls(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [getUrl, idsKey]);

  return urls;
}

type FileEntry = {
  id: string;
};

export function useGameFileUrls(
  files: FileEntry[]
): Record<string, string | null> {
  return useSignedFileUrls(
    files.map((file) => file.id),
    getGameFileUrl
  );
}
