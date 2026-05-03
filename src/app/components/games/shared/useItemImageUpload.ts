"use client";

import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useCallback, useState } from "react";

export type ItemImageUploadType =
  | "custom_items"
  | "custom_enemies"
  | "unique_items"
  | "games"
  | "characters";

export function useItemImageUpload(type: ItemImageUploadType) {
  const [imageKey, setImageKey] = useState("");
  const [pendingImageKey, setPendingImageKey] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const deleteUploadedImage = useCallback(async (key: string) => {
    try {
      await fetch(`/api/upload-file?fileKey=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
    } catch {
      // best-effort cleanup
    }
  }, []);

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file) {
        if (pendingImageKey) {
          await deleteUploadedImage(pendingImageKey);
          setPendingImageKey("");
        }
        setImageKey("");
        setUploadError(null);
        return;
      }
      if (!file.type.startsWith("image/")) {
        setUploadError("Please choose an image file (e.g. PNG, JPEG).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Image must be 5MB or smaller.");
        return;
      }
      setUploadError(null);
      setUploading(true);
      if (pendingImageKey) {
        await deleteUploadedImage(pendingImageKey);
        setPendingImageKey("");
      }
      try {
        const formData = new FormData();
        formData.set("file", file);
        const res = await fetch(
          `/api/upload-file?type=${encodeURIComponent(type)}`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        if (!res.ok) {
          setUploadError(
            (data as { message?: string })?.message ?? "Upload failed"
          );
          return;
        }
        const key = (data as { fileKey?: string }).fileKey;
        if (key) {
          setImageKey(key);
          setPendingImageKey(key);
        }
      } catch (e) {
        setUploadError(getUserSafeErrorMessage(e, "Upload failed"));
      } finally {
        setUploading(false);
      }
    },
    [type, pendingImageKey, deleteUploadedImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const reset = useCallback(() => {
    setImageKey("");
    setPendingImageKey("");
    setUploadError(null);
  }, []);

  return {
    imageKey,
    pendingImageKey,
    setImageKey,
    setPendingImageKey,
    uploading,
    uploadError,
    setUploadError,
    handleFile,
    handleDrop,
    handleDragOver,
    deleteUploadedImage,
    reset,
  };
}
