"use client";

import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { TextField } from "@/app/components/shared/TextField";
import { TextArea } from "@/app/components/shared/TextArea";
import { ImageUploadDropzone } from "@/app/components/shared/ImageUploadDropzone";
import { useImageUpload } from "@/hooks/use-image-upload";
import { createGameImage } from "@/lib/api/gameImages";
import { useCallback, useMemo, useState, type FormEvent } from "react";

type CreateGameImageModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function CreateGameImageModal({
  isOpen,
  gameId,
  gameName,
  onClose,
  onSuccess,
}: CreateGameImageModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const imageUpload = useImageUpload("games");
  const {
    imageKey,
    pendingImageKey,
    deleteUploadedImage,
    reset: resetImageUpload,
  } = imageUpload;

  const submitDisabled = useMemo(
    () => submitting || !title.trim() || !imageKey,
    [imageKey, submitting, title]
  );

  const reset = useCallback(() => {
    setTitle("");
    setDescription("");
    setError(null);
    resetImageUpload();
  }, [resetImageUpload]);

  const handleClose = useCallback(() => {
    if (submitting) return;
    if (pendingImageKey) {
      void deleteUploadedImage(pendingImageKey);
    }
    reset();
    onClose();
  }, [deleteUploadedImage, onClose, pendingImageKey, reset, submitting]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!imageKey) return setError("Image file is required.");

    try {
      setSubmitting(true);
      setError(null);
      await createGameImage(gameId, {
        title: title.trim(),
        description: description.trim() || null,
        imageKey,
      });
      reset();
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setSubmitting(false);
    }
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
        <FieldLabel id="game-image-title" label="Title" required />
        <TextField
          id="game-image-title"
          type="text"
          variant="dark"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Citadel Exterior"
          disabled={submitting}
        />
      </div>
      <div>
        <FieldLabel id="game-image-description" label="Description" />
        <TextArea
          id="game-image-description"
          variant="dark"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-[88px]"
          placeholder="Optional short description"
          rows={3}
          disabled={submitting}
        />
      </div>
      <ImageUploadDropzone
        id="game-image-file"
        label="Image file"
        imageKey={imageKey}
        onFileChange={(file) => void imageUpload.handleFile(file)}
        onDrop={imageUpload.handleDrop}
        onDragOver={imageUpload.handleDragOver}
        uploading={imageUpload.uploading}
        error={imageUpload.uploadError}
        disabled={submitting}
        previewLayout="cover"
        previewImageAlt={title.trim() ? `${title.trim()} image` : "Game image"}
        previewCaption="Image preview — this is how players will see this visual."
      />
    </GameFormModal>
  );
}
