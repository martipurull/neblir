"use client";

import { useImageUpload } from "@/hooks/use-image-upload";
import { ImageUploadDropzone } from "@/app/components/shared/ImageUploadDropzone";
import type { GameDetail } from "@/app/lib/types/game";
import { updateGame } from "@/lib/api/game";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useCallback, useEffect, useRef, useState } from "react";

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

  const imageUpload = useImageUpload("games", imageKey ?? "");
  const { imageKey: localImageKey, setImageKey, uploading } = imageUpload;

  useEffect(() => {
    const saved = imageKey ?? "";
    savedKeyRef.current = saved;
    setImageKey(saved);
  }, [imageKey, setImageKey]);

  const previewKey = localImageKey ?? imageKey ?? "";

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
        Shown on the game page and games list. Upload or replace the cover
        below; tap the preview to open the full size image.
      </p>

      <div className="mt-3">
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
          previewLayout={previewKey ? "cover" : undefined}
          previewImageAlt={`${gameName} cover`}
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
