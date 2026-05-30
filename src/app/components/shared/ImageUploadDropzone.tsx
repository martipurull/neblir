"use client";

import { Button } from "@/app/components/shared/Button";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { ModalFieldLabel } from "../games/shared/ModalFieldLabel";
import Image from "next/image";
import { useCallback, useRef } from "react";

type ImageUploadDropzoneProps = {
  id: string;
  label: string;
  imageKey: string;
  onFileChange: (file: File | null) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  uploading: boolean;
  error: string | null;
  disabled?: boolean;
  /** Use "light" for light backgrounds (e.g. character create page). */
  variant?: "default" | "light";
  /** Resolved image URL for preview layouts (e.g. character avatar). */
  previewImageUrl?: string | null;
  /** When set with an uploaded imageKey, replaces the filename row with a styled preview. */
  previewLayout?: "characterAvatar";
  previewImageAlt?: string;
};

/**
 * Native file inputs must not use in-flow `sr-only` positioning: focusing them
 * (via label htmlFor) scrolls the page and can inflate scroll height.
 */
const hiddenFileInputClassName =
  "pointer-events-none fixed left-0 top-0 h-px w-px overflow-hidden opacity-0";

export function ImageUploadDropzone({
  id,
  label,
  imageKey,
  onFileChange,
  onDrop,
  onDragOver,
  uploading,
  error,
  disabled = false,
  variant = "default",
  previewImageUrl = null,
  previewLayout,
  previewImageAlt = "Uploaded image preview",
}: ImageUploadDropzoneProps) {
  const isLight = variant === "light";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const labelId = `${id}-label`;
  const inactive = disabled || uploading;

  const openFilePicker = useCallback(() => {
    if (inactive) return;
    const scrollRoot =
      fileInputRef.current?.closest("#app-scroll") ??
      document.getElementById("app-scroll");
    const scrollTop =
      scrollRoot instanceof HTMLElement ? scrollRoot.scrollTop : 0;
    fileInputRef.current?.click();
    // Browsers may nudge scroll when the native picker opens; restore home scroll position.
    requestAnimationFrame(() => {
      if (scrollRoot instanceof HTMLElement) {
        scrollRoot.scrollTop = scrollTop;
      }
    });
  }, [inactive]);

  const dropzoneClassName = isLight
    ? "relative mt-1 overflow-hidden rounded-md border-2 border-dashed border-black/30 bg-black/5 p-4 transition-colors hover:border-black/50"
    : "relative mt-1 overflow-hidden rounded border-2 border-dashed border-white/30 bg-paleBlue/5 p-4 transition-colors hover:border-white/50";

  const showCharacterAvatarPreview =
    Boolean(imageKey) && previewLayout === "characterAvatar";

  const uploadedPreview = showCharacterAvatarPreview ? (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-paleBlue/20">
        {previewImageUrl ? (
          <Image
            src={previewImageUrl}
            alt={previewImageAlt}
            width={48}
            height={48}
            className="h-12 w-12 object-cover object-top"
          />
        ) : (
          <ImageLoadingSkeleton
            variant="avatar"
            className="h-full w-full [&_svg]:h-12 [&_svg]:w-12"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={
            isLight ? "text-sm text-black/70" : "text-sm text-white/80"
          }
        >
          Avatar preview — this is how it will appear on your character page.
        </p>
        <Button
          type="button"
          variant={isLight ? "lightRemoveLinkOnPale" : "lightRemoveLinkOnModal"}
          fullWidth={false}
          onClick={() => onFileChange(null)}
          disabled={inactive}
          className="shrink-0 self-start sm:self-center"
        >
          Remove
        </Button>
      </div>
    </div>
  ) : imageKey ? (
    <div className="flex items-center justify-between gap-2">
      <span
        className={
          isLight
            ? "truncate text-sm text-neblirSafe-600"
            : "truncate text-sm text-neblirSafe-400"
        }
      >
        Image uploaded: {imageKey}
      </span>
      <Button
        type="button"
        variant={isLight ? "lightRemoveLinkOnPale" : "lightRemoveLinkOnModal"}
        fullWidth={false}
        onClick={() => onFileChange(null)}
        disabled={inactive}
      >
        Remove
      </Button>
    </div>
  ) : (
    <button
      type="button"
      disabled={inactive}
      aria-labelledby={labelId}
      className={
        isLight
          ? "flex w-full cursor-pointer flex-col items-center gap-1 text-center text-sm text-black/70 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          : "flex w-full cursor-pointer flex-col items-center gap-1 text-center text-sm text-white/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      }
      onClick={(e) => {
        e.preventDefault();
        openFilePicker();
      }}
    >
      <span>
        {uploading ? "Uploading…" : "Drag an image here or click to browse"}
      </span>
    </button>
  );

  return (
    <section className="min-h-0">
      {isLight ? (
        <p id={labelId} className="mb-1 block text-sm font-bold text-black">
          {label}
        </p>
      ) : (
        <ModalFieldLabel
          id={labelId}
          label={label}
          required={false}
          associateControl={false}
        />
      )}
      <div
        onDrop={showCharacterAvatarPreview ? undefined : onDrop}
        onDragOver={showCharacterAvatarPreview ? undefined : onDragOver}
        className={
          showCharacterAvatarPreview
            ? isLight
              ? "relative mt-1 rounded-md border border-black/20 bg-black/5 p-4"
              : "relative mt-1 rounded border border-white/20 bg-paleBlue/5 p-4"
            : dropzoneClassName
        }
      >
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          tabIndex={-1}
          aria-hidden
          className={hiddenFileInputClassName}
          disabled={inactive}
          onChange={(e) => {
            const f = e.target.files?.[0];
            onFileChange(f ?? null);
            e.target.value = "";
          }}
        />
        {uploadedPreview}
        {error ? (
          <p
            className={
              isLight
                ? "mt-2 text-xs text-neblirDanger-600"
                : "mt-2 text-xs text-neblirDanger-400"
            }
          >
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
