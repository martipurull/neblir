"use client";

import { Button } from "@/app/components/shared/Button";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import { useImageUploadPreviewUrl } from "@/hooks/use-image-upload-preview-url";
import { useCallback, useRef } from "react";

export type ImageUploadPreviewLayout =
  | "roundAvatar"
  | "characterAvatar"
  | "itemThumbnail"
  | "cover";

type NormalizedPreviewLayout = "roundAvatar" | "itemThumbnail" | "cover";

const DEFAULT_PREVIEW_CAPTION: Record<NormalizedPreviewLayout, string> = {
  roundAvatar:
    "Image preview — this is how it will appear in lists and detail views.",
  itemThumbnail: "Image preview — this is how it will appear in item details.",
  cover: "Cover preview — this is how it will appear on the game page.",
};

function normalizePreviewLayout(
  layout?: ImageUploadPreviewLayout
): NormalizedPreviewLayout | undefined {
  if (!layout) return undefined;
  if (layout === "characterAvatar") return "roundAvatar";
  return layout;
}

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
  /** When set with an uploaded imageKey, replaces the filename row with a styled preview. */
  previewLayout?: ImageUploadPreviewLayout;
  /** Stable id for URL resolution when multiple dropzones share a page. Defaults to `${id}-preview`. */
  previewId?: string;
  /** Override auto-resolved preview URL; omit to resolve from imageKey automatically. */
  previewImageUrl?: string | null;
  previewImageAlt?: string;
  previewCaption?: string;
};

/**
 * Native file inputs must not use in-flow `sr-only` positioning: focusing them
 * (via label htmlFor) scrolls the page and can inflate scroll height.
 */
const hiddenFileInputClassName =
  "pointer-events-none fixed left-0 top-0 h-px w-px overflow-hidden opacity-0";

function previewMutedTextClassName(isLight: boolean) {
  return isLight ? "text-sm text-black/70" : "text-sm text-white/80";
}

function previewHintTextClassName(isLight: boolean) {
  return isLight ? "text-xs text-black/60" : "text-xs text-white/60";
}

function previewUnavailableClassName(isLight: boolean) {
  return isLight
    ? "flex h-40 items-center justify-center rounded-md border border-black/20 bg-black/5 px-4 text-sm text-black/60"
    : "flex h-40 items-center justify-center rounded border border-white/20 bg-paleBlue/5 px-4 text-sm text-white/60";
}

type PreviewContentProps = {
  layout: NormalizedPreviewLayout;
  previewImageUrl: string | null | undefined;
  previewImageKey: string;
  previewImageAlt: string;
  previewCaption: string;
  isLight: boolean;
  inactive: boolean;
  onFileChange: (file: File | null) => void;
};

function RoundAvatarPreview({
  previewImageUrl,
  previewImageKey,
  previewImageAlt,
  previewCaption,
  isLight,
  inactive,
  onFileChange,
}: Omit<PreviewContentProps, "layout">) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-paleBlue/20">
        {previewImageUrl ? (
          <SignedRemoteImage
            src={previewImageUrl}
            imageKey={previewImageKey}
            alt={previewImageAlt}
            width={48}
            height={48}
            className="h-12 w-12 object-cover object-top"
          />
        ) : previewImageUrl === undefined ? (
          <ImageLoadingSkeleton
            variant="avatar"
            className="h-full w-full [&_svg]:h-12 [&_svg]:w-12"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className={previewMutedTextClassName(isLight)}>{previewCaption}</p>
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
  );
}

function ItemThumbnailPreview({
  previewImageUrl,
  previewImageKey,
  previewImageAlt,
  previewCaption,
  isLight,
  inactive,
  onFileChange,
}: Omit<PreviewContentProps, "layout">) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-paleBlue/20">
        {previewImageUrl ? (
          <SignedRemoteImage
            src={previewImageUrl}
            imageKey={previewImageKey}
            alt={previewImageAlt}
            width={80}
            height={80}
            className="max-h-20 max-w-20 object-contain object-center"
          />
        ) : previewImageUrl === undefined ? (
          <ImageLoadingSkeleton variant="item" className="h-20 w-20" />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className={previewMutedTextClassName(isLight)}>{previewCaption}</p>
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
  );
}

function CoverPreview({
  previewImageUrl,
  previewImageKey,
  previewImageAlt,
  previewCaption,
  isLight,
  inactive,
  onFileChange,
}: Omit<PreviewContentProps, "layout">) {
  const borderClassName = isLight
    ? "overflow-hidden rounded-md border border-black/20 bg-black/5"
    : "overflow-hidden rounded border border-white/20 bg-paleBlue/5";

  return (
    <div className="flex flex-col gap-3">
      {previewImageUrl ? (
        <>
          <a
            href={previewImageUrl}
            target="_blank"
            rel="noreferrer"
            className={`block w-full text-left focus:outline-none focus-visible:ring-2 ${
              isLight ? "focus-visible:ring-black" : "focus-visible:ring-white"
            } ${borderClassName}`}
          >
            <span className="sr-only">Open {previewImageAlt}</span>
            <span className="block w-full">
              <SignedRemoteImage
                src={previewImageUrl}
                imageKey={previewImageKey}
                alt={previewImageAlt}
                width={1600}
                height={900}
                sizes="(max-width: 768px) 100vw, 1024px"
                className="h-auto max-h-[50vh] w-full object-contain"
              />
            </span>
          </a>
          <p className={previewHintTextClassName(isLight)}>
            Tap or click the image to open the full size.
          </p>
        </>
      ) : previewImageUrl === undefined ? (
        <div className={`block h-48 ${borderClassName}`}>
          <ImageLoadingSkeleton
            variant="cityscape"
            className={isLight ? "!bg-black/5" : "!bg-paleBlue/5"}
          />
        </div>
      ) : (
        <div className={previewUnavailableClassName(isLight)}>
          Image preview unavailable.
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className={previewMutedTextClassName(isLight)}>{previewCaption}</p>
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
  );
}

function ImageUploadPreview({
  layout,
  previewImageUrl,
  previewImageKey,
  previewImageAlt,
  previewCaption,
  isLight,
  inactive,
  onFileChange,
}: PreviewContentProps) {
  switch (layout) {
    case "roundAvatar":
      return (
        <RoundAvatarPreview
          previewImageUrl={previewImageUrl}
          previewImageKey={previewImageKey}
          previewImageAlt={previewImageAlt}
          previewCaption={previewCaption}
          isLight={isLight}
          inactive={inactive}
          onFileChange={onFileChange}
        />
      );
    case "itemThumbnail":
      return (
        <ItemThumbnailPreview
          previewImageUrl={previewImageUrl}
          previewImageKey={previewImageKey}
          previewImageAlt={previewImageAlt}
          previewCaption={previewCaption}
          isLight={isLight}
          inactive={inactive}
          onFileChange={onFileChange}
        />
      );
    case "cover":
      return (
        <CoverPreview
          previewImageUrl={previewImageUrl}
          previewImageKey={previewImageKey}
          previewImageAlt={previewImageAlt}
          previewCaption={previewCaption}
          isLight={isLight}
          inactive={inactive}
          onFileChange={onFileChange}
        />
      );
  }
}

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
  previewLayout,
  previewId,
  previewImageUrl: previewImageUrlProp,
  previewImageAlt = "Uploaded image preview",
  previewCaption,
}: ImageUploadDropzoneProps) {
  const isLight = variant === "light";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const labelId = `${id}-label`;
  const inactive = disabled || uploading;
  const normalizedPreviewLayout = normalizePreviewLayout(previewLayout);
  const resolvedPreviewId = previewId ?? `${id}-preview`;
  const autoPreviewUrl = useImageUploadPreviewUrl(
    normalizedPreviewLayout && previewImageUrlProp === undefined
      ? imageKey
      : "",
    resolvedPreviewId
  );
  const previewImageUrl =
    previewImageUrlProp !== undefined ? previewImageUrlProp : autoPreviewUrl;
  const effectivePreviewCaption =
    previewCaption ??
    (normalizedPreviewLayout
      ? DEFAULT_PREVIEW_CAPTION[normalizedPreviewLayout]
      : "");

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

  const showPreview = Boolean(imageKey) && Boolean(normalizedPreviewLayout);

  const uploadedPreview =
    showPreview && normalizedPreviewLayout ? (
      <ImageUploadPreview
        layout={normalizedPreviewLayout}
        previewImageUrl={previewImageUrl}
        previewImageKey={imageKey}
        previewImageAlt={previewImageAlt}
        previewCaption={effectivePreviewCaption}
        isLight={isLight}
        inactive={inactive}
        onFileChange={onFileChange}
      />
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
      <Button
        type="button"
        variant={
          isLight
            ? "imageUploadBrowseTriggerLight"
            : "imageUploadBrowseTriggerDark"
        }
        fullWidth={false}
        disabled={inactive}
        aria-labelledby={labelId}
        className="w-full"
        onClick={(e) => {
          e.preventDefault();
          openFilePicker();
        }}
      >
        <span>
          {uploading ? "Uploading…" : "Drag an image here or click to browse"}
        </span>
      </Button>
    );

  return (
    <section className="min-h-0">
      {isLight ? (
        <FieldLabel
          id={labelId}
          label={label}
          associateControl={false}
          variant="light"
        />
      ) : (
        <FieldLabel
          id={labelId}
          label={label}
          required={false}
          associateControl={false}
          variant="dark"
        />
      )}
      <div
        onDrop={showPreview ? undefined : onDrop}
        onDragOver={showPreview ? undefined : onDragOver}
        className={
          showPreview
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
