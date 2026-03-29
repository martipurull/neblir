"use client";

import { ModalFieldLabel } from "./ModalFieldLabel";
import React from "react";

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
  return (
    <section>
      {isLight ? (
        <label htmlFor={id} className="mb-1 block text-sm font-bold text-black">
          {label}
        </label>
      ) : (
        <ModalFieldLabel id={id} label={label} required={false} />
      )}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className={
          isLight
            ? "mt-1 rounded-md border-2 border-dashed border-black/30 bg-black/5 p-4 transition-colors hover:border-black/50"
            : "mt-1 rounded border-2 border-dashed border-white/30 bg-white/5 p-4 transition-colors hover:border-white/50"
        }
      >
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="sr-only"
          disabled={disabled || uploading}
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
            <button
              type="button"
              onClick={() => onFileChange(null)}
              disabled={disabled || uploading}
              className={
                isLight
                  ? "shrink-0 text-sm text-black/70 underline hover:text-black disabled:opacity-50"
                  : "shrink-0 text-sm text-white/80 underline hover:text-white disabled:opacity-50"
              }
            >
              Remove
            </button>
          </div>
        ) : (
          <label
            htmlFor={id}
            className={
              isLight
                ? "flex cursor-pointer flex-col items-center gap-1 text-center text-sm text-black/70 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                : "flex cursor-pointer flex-col items-center gap-1 text-center text-sm text-white/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            }
          >
            <span>
              {uploading
                ? "Uploading…"
                : "Drag an image here or click to browse"}
            </span>
          </label>
        )}
        {error && (
          <p
            className={
              isLight
                ? "mt-2 text-xs text-neblirDanger-600"
                : "mt-2 text-xs text-neblirDanger-400"
            }
          >
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
