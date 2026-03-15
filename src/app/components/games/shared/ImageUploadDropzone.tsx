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
}: ImageUploadDropzoneProps) {
  return (
    <section>
      <ModalFieldLabel id={id} label={label} required={false} />
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="mt-1 rounded border-2 border-dashed border-white/30 bg-white/5 p-4 transition-colors hover:border-white/50"
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
            <span className="truncate text-sm text-neblirSafe-400">
              Image uploaded: {imageKey}
            </span>
            <button
              type="button"
              onClick={() => onFileChange(null)}
              disabled={disabled || uploading}
              className="shrink-0 text-sm text-white/80 underline hover:text-white disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ) : (
          <label
            htmlFor={id}
            className="flex cursor-pointer flex-col items-center gap-1 text-center text-sm text-white/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>
              {uploading
                ? "Uploading…"
                : "Drag an image here or click to browse"}
            </span>
          </label>
        )}
        {error && <p className="mt-2 text-xs text-neblirDanger-400">{error}</p>}
      </div>
    </section>
  );
}
