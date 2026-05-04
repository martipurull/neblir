"use client";

import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { ModalFieldLabel } from "@/app/components/games/shared/ModalFieldLabel";
import { modalInputClass } from "@/app/components/games/shared/modalStyles";
import Button from "@/app/components/shared/Button";
import { createGameImage } from "@/lib/api/gameImages";
import React, { useMemo, useRef, useState } from "react";

type CreateGameImageModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  onClose: () => void;
  onSuccess?: () => void;
};

async function uploadImageFile(file: File): Promise<{ fileKey: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/upload-file?type=games", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(body.message ?? "Failed to upload image");
  }
  const data = (await response.json()) as { fileKey?: string };
  if (!data.fileKey)
    throw new Error("Upload succeeded but no file key was returned.");
  return { fileKey: data.fileKey };
}

async function deleteUploadedImageFile(fileKey: string): Promise<void> {
  await fetch(`/api/upload-file?fileKey=${encodeURIComponent(fileKey)}`, {
    method: "DELETE",
  });
}

export default function CreateGameImageModal({
  isOpen,
  gameId,
  gameName,
  onClose,
  onSuccess,
}: CreateGameImageModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const submitDisabled = useMemo(
    () => submitting || !title.trim() || !file,
    [file, submitting, title]
  );

  const reset = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return setError("Image file is required.");
    if (!file.type.startsWith("image/"))
      return setError("Only image files are allowed.");

    let uploadedKey: string | null = null;
    try {
      setSubmitting(true);
      setError(null);
      const upload = await uploadImageFile(file);
      uploadedKey = upload.fileKey;
      await createGameImage(gameId, {
        title: title.trim(),
        description: description.trim() || null,
        imageKey: upload.fileKey,
      });
      reset();
      onClose();
      onSuccess?.();
    } catch (err) {
      if (uploadedKey) void deleteUploadedImageFile(uploadedKey);
      setError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectImageFile = (candidate: File | null) => {
    if (!candidate) return;
    if (!candidate.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }
    setError(null);
    setFile(candidate);
  };

  return (
    <GameFormModal
      isOpen={isOpen}
      title={`Upload image — ${gameName}`}
      subtitle="Upload game-specific visuals for players."
      titleId="create-game-image-title"
      error={error}
      onClose={handleClose}
      onSubmit={(event) => void handleSubmit(event)}
      submitting={submitting}
      submitLabel="Upload image"
      submittingLabel="Uploading…"
      submitDisabled={submitDisabled}
    >
      <div>
        <ModalFieldLabel id="game-image-title" label="Title" required />
        <input
          id="game-image-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={modalInputClass}
          placeholder="e.g. Citadel Exterior"
          disabled={submitting}
        />
      </div>
      <div>
        <ModalFieldLabel id="game-image-description" label="Description" />
        <textarea
          id="game-image-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={`${modalInputClass} min-h-[88px]`}
          placeholder="Optional short description"
          rows={3}
          disabled={submitting}
        />
      </div>
      <div>
        <ModalFieldLabel id="game-image-file" label="Image file" required />
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (!submitting) fileInputRef.current?.click();
          }}
          onKeyDown={(event) => {
            if (submitting) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!submitting) setIsDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragActive(false);
            if (submitting) return;
            const dropped = event.dataTransfer.files?.[0] ?? null;
            selectImageFile(dropped);
          }}
          className={`rounded-md border-2 border-dashed px-4 py-4 transition-colors ${
            isDragActive
              ? "border-paleBlue bg-paleBlue/10"
              : "border-white/40 bg-transparent"
          }`}
          aria-label="Upload image by dropping a file or choosing one"
        >
          <div className="flex flex-col items-start gap-2">
            <Button
              type="button"
              variant="modalFooterSecondary"
              fullWidth={false}
              disabled={submitting}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Choose file
            </Button>
            <p className="text-xs text-white/80">
              or drag and drop an image here
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          id="game-image-file"
          type="file"
          accept="image/*"
          disabled={submitting}
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            selectImageFile(nextFile);
          }}
          className="sr-only"
        />
        {file ? (
          <p className="mt-1 text-xs text-white/70">
            Selected: {file.name} ({Math.ceil(file.size / 1024)} KB)
          </p>
        ) : null}
      </div>
    </GameFormModal>
  );
}
