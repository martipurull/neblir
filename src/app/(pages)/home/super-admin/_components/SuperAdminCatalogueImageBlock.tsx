"use client";

import { ImageUploadDropzone } from "@/app/components/games/shared/ImageUploadDropzone";
import {
  useItemImageUpload,
  type ItemImageUploadType,
} from "@/app/components/games/shared/useItemImageUpload";
import { useEffect } from "react";

/** Isolated image upload so TipTap siblings do not re-render on upload state changes. */
export function SuperAdminCatalogueImageBlock({
  uploadType,
  id,
  label,
  disabled = false,
  onImageKey,
}: {
  uploadType: ItemImageUploadType;
  id: string;
  label: string;
  disabled?: boolean;
  onImageKey: (key: string) => void;
}) {
  const imageUpload = useItemImageUpload(uploadType);

  useEffect(() => {
    onImageKey(imageUpload.imageKey);
  }, [imageUpload.imageKey, onImageKey]);

  return (
    <div className="mb-6">
      <ImageUploadDropzone
        id={id}
        label={label}
        imageKey={imageUpload.imageKey}
        onFileChange={(file) => {
          void imageUpload.handleFile(file);
        }}
        onDrop={imageUpload.handleDrop}
        onDragOver={imageUpload.handleDragOver}
        uploading={imageUpload.uploading}
        error={imageUpload.uploadError}
        disabled={disabled}
        variant="light"
      />
    </div>
  );
}
