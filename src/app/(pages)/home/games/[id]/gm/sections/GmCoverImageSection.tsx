"use client";

import { useItemImageUpload } from "@/app/components/games/shared/useItemImageUpload";
import { ImageUploadDropzone } from "@/app/components/shared/ImageUploadDropzone";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import type { GameDetail } from "@/app/lib/types/game";
import { useImageUrls } from "@/hooks/use-image-urls";
import { updateGame } from "@/lib/api/game";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type GmCoverImageSectionProps = {
  gameId: string;
  gameName: string;
  imageKey: string | null | undefined;
  onUpdated: (game: GameDetail) => void | Promise<void>;
};

export function GmCoverImageSection({
  gameId,
  gameName,
  imageKey,
  onUpdated,
}: GmCoverImageSectionProps) {
  const savedKeyRef = useRef(imageKey ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const imageUpload = useItemImageUpload("games", imageKey ?? "");
  const { imageKey: localImageKey, setImageKey, uploading } = imageUpload;

  useEffect(() => {
    const saved = imageKey ?? "";
    savedKeyRef.current = saved;
    setImageKey(saved);
  }, [imageKey, setImageKey]);

  const previewKey = localImageKey ?? imageKey ?? "";
  const imageEntries = useMemo(
    () => (previewKey ? [{ id: gameId, imageKey: previewKey }] : []),
    [gameId, previewKey]
  );
  const imageUrls = useImageUrls(imageEntries);
  const previewUrl = previewKey ? imageUrls[gameId] : null;

  const persistCover = useCallback(
    async (nextKey: string | null) => {
      const normalized = nextKey?.trim() ?? null;
      const saved = savedKeyRef.current.trim() || null;
      if (normalized === saved) return;

      setSaveError(null);
      setSaving(true);
      try {
        const updated = await updateGame(gameId, { imageKey: normalized });
        savedKeyRef.current = normalized ?? "";
        await onUpdated(updated);
      } catch (err) {
        setSaveError(
          getUserSafeErrorMessage(err, "Failed to update cover image")
        );
        setImageKey(savedKeyRef.current);
      } finally {
        setSaving(false);
      }
    },
    [gameId, onUpdated, setImageKey]
  );

  useEffect(() => {
    if (uploading) return;
    const next = localImageKey.trim();
    const saved = savedKeyRef.current.trim();
    if (next === saved) return;
    void persistCover(next || null);
  }, [localImageKey, uploading, persistCover]);

  const dropzoneBusy = saving || uploading;

  return (
    <div className="rounded-md border border-black p-4">
      <span className="text-sm font-semibold text-black">Cover image</span>
      <p className="mt-1 text-xs text-black/70">
        Shown on the game page and games list. Click the image to view it full
        size, or use the area below to replace or remove it.
      </p>

      {previewKey ? (
        <div className="mt-4">
          {previewUrl ? (
            <>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="block w-full overflow-hidden rounded-md border border-black/20 bg-black/5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                <span className="sr-only">Open {gameName} cover image</span>
                <span className="block w-full">
                  <Image
                    src={previewUrl}
                    alt={`${gameName} cover`}
                    width={1600}
                    height={900}
                    sizes="(max-width: 768px) 100vw, 1024px"
                    className="h-auto max-h-[50vh] w-full object-contain"
                    unoptimized
                  />
                </span>
              </a>
              <p className="mt-2 text-xs text-black/60">
                Tap or click the image to open the full size.
              </p>
            </>
          ) : previewUrl === undefined ? (
            <div className="block h-48 overflow-hidden rounded-md border border-black/20 bg-black/5">
              <ImageLoadingSkeleton
                variant="cityscape"
                className="!bg-black/5"
              />
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-md border border-black/20 bg-black/5 px-4 text-sm text-black/60">
              Cover image unavailable.
            </div>
          )}
        </div>
      ) : null}

      <div className={previewKey ? "mt-4" : "mt-3"}>
        <ImageUploadDropzone
          id="gm-game-cover-image"
          label={previewKey ? "Replace cover image" : "Cover image"}
          imageKey={localImageKey}
          onFileChange={(file) => void imageUpload.handleFile(file)}
          onDrop={imageUpload.handleDrop}
          onDragOver={imageUpload.handleDragOver}
          uploading={imageUpload.uploading}
          error={imageUpload.uploadError}
          disabled={dropzoneBusy}
          variant="light"
        />
      </div>

      {saving ? (
        <p className="mt-2 text-xs text-black/60">Saving cover image…</p>
      ) : null}
      {saveError ? (
        <p className="mt-2 text-sm text-neblirDanger-600" role="alert">
          {saveError}
        </p>
      ) : null}
    </div>
  );
}
