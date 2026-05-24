"use client";

import Button from "@/app/components/shared/Button";
import { ModalFieldLabel } from "../games/shared/ModalFieldLabel";
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
        onDrop={onDrop}
        onDragOver={onDragOver}
        className={dropzoneClassName}
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
        {imageKey ? (
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
              variant={
                isLight ? "lightRemoveLinkOnPale" : "lightRemoveLinkOnModal"
              }
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
              {uploading
                ? "Uploading…"
                : "Drag an image here or click to browse"}
            </span>
          </button>
        )}
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
