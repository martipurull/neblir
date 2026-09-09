import { isPdfFileName } from "@/app/lib/r2UploadKeys";
import { getGameFileDownload } from "@/lib/api/gameFiles";
import { getRecapDownload } from "@/lib/api/recaps";
import { getLoreAttachmentDownload } from "@/lib/api/loreAttachments";
import { useEffect, useState } from "react";

type SignedFileDownload = {
  url: string;
  thumbnailUrl?: string;
};

function useSignedFileDownloads(
  ids: string[],
  getDownload: (id: string) => Promise<SignedFileDownload>
): Record<string, SignedFileDownload | null> {
  const idsKey = ids.join(",");
  const [downloads, setDownloads] = useState<
    Record<string, SignedFileDownload | null>
  >({});

  useEffect(() => {
    if (!idsKey) {
      return;
    }

    let cancelled = false;
    const nextIds = idsKey.split(",").filter(Boolean);

    void Promise.all(
      nextIds.map(async (id) => {
        try {
          const download = await getDownload(id);
          return [id, download] as const;
        } catch {
          return [id, null] as const;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setDownloads(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [getDownload, idsKey]);

  return downloads;
}

type FilePreviewEntry = {
  id: string;
  kind?: "IMAGE" | "PDF";
  thumbnailKey?: string | null;
};

export function useGameFileUrls(
  files: FilePreviewEntry[]
): Record<string, string | null> {
  const ids = files
    .filter((file) => file.kind !== "PDF" || Boolean(file.thumbnailKey))
    .map((file) => file.id);
  const downloads = useSignedFileDownloads(ids, getGameFileDownload);
  const urls: Record<string, string | null> = {};
  for (const file of files) {
    const download = downloads[file.id];
    if (file.kind === "PDF") {
      urls[file.id] = download?.thumbnailUrl ?? null;
    } else if (download !== undefined) {
      urls[file.id] = download?.url ?? null;
    }
  }
  return urls;
}

export function useRecapPreviewUrls(
  recaps: Array<{ id: string; thumbnailKey?: string | null }>
): Record<string, string | null> {
  const ids = recaps
    .filter((recap) => Boolean(recap.thumbnailKey))
    .map((recap) => recap.id);
  const downloads = useSignedFileDownloads(ids, getRecapDownload);
  const urls: Record<string, string | null> = {};
  for (const recap of recaps) {
    urls[recap.id] = downloads[recap.id]?.thumbnailUrl ?? null;
  }
  return urls;
}

export function useLoreAttachmentPreviewUrls(
  attachments: Array<{
    id: string;
    fileName: string;
    thumbnailKey?: string | null;
  }>
): Record<string, string | null> {
  const ids = attachments
    .filter(
      (attachment) =>
        !isPdfFileName(attachment.fileName) || Boolean(attachment.thumbnailKey)
    )
    .map((attachment) => attachment.id);
  const downloads = useSignedFileDownloads(ids, getLoreAttachmentDownload);
  const urls: Record<string, string | null> = {};
  for (const attachment of attachments) {
    const download = downloads[attachment.id];
    if (isPdfFileName(attachment.fileName)) {
      urls[attachment.id] = download?.thumbnailUrl ?? null;
    } else if (download !== undefined) {
      urls[attachment.id] = download?.url ?? null;
    }
  }
  return urls;
}
