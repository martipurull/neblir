"use client";

import {
  ImageUploadDropzone,
  type ImageUploadPreviewLayout,
} from "@/app/components/shared/ImageUploadDropzone";
import { useImageUpload, type ImageUploadKind } from "@/hooks/use-image-upload";
import { useEffect } from "react";

/** Isolated image upload so TipTap siblings do not re-render on upload state changes. */
export function SuperAdminCatalogueImageBlock({
  uploadType,
  id,
  label,
  disabled = false,
  initialImageKey = "",
  onImageKey,
  previewLayout,
  previewAlt = "Catalogue image",
}: {
  uploadType: ImageUploadKind;
  id: string;
  label: string;
  disabled?: boolean;
  initialImageKey?: string;
  onImageKey: (key: string) => void;
  previewLayout?: ImageUploadPreviewLayout;
  previewAlt?: string;
}) {
  const imageUpload = useImageUpload(uploadType, initialImageKey);

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
        previewLayout={previewLayout}
        previewImageAlt={previewAlt}
      />
    </div>
  );
}
