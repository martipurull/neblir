"use client";

import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { ChosenFileName } from "@/app/components/shared/ChosenFileName";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { FilePicker } from "@/app/components/shared/FilePicker";
import { TextField } from "@/app/components/shared/TextField";
import { TextArea } from "@/app/components/shared/TextArea";
import { RadioGroup } from "@/app/components/shared/RadioGroup";
import {
  DOCUMENT_IMAGE_MAX_SIZE_BYTES,
  DOCUMENT_IMAGE_MAX_SIZE_LABEL,
  PDF_MAX_SIZE_BYTES,
  PDF_MAX_SIZE_LABEL,
} from "@/app/lib/constants/uploadLimits";
import {
  isImageFileName,
  isPdfFileName,
  type GameFileKind,
} from "@/app/lib/r2UploadKeys";
import { tryUploadPdfPage1Thumbnail } from "@/app/lib/pdfPage1Thumbnail";
import type { GameFile, GameFileAccess } from "@/app/lib/types/gameFile";
import {
  createGameFile,
  deleteUploadedGameFile,
  requestGameFileUploadUrl,
  updateGameFile,
  uploadGameFileToStorage,
} from "@/lib/api/gameFiles";
import { useCallback, useMemo, useState, type FormEvent } from "react";

type CreateGameFileModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  mode?: "create" | "edit";
  file?: GameFile | null;
  onClose: () => void;
  onSuccess?: () => void;
};

function gameFileKindFromFile(file: File): GameFileKind | null {
  if (file.type === "application/pdf" || isPdfFileName(file.name)) {
    return "PDF";
  }
  if (file.type.startsWith("image/") || isImageFileName(file.name)) {
    return "IMAGE";
  }
  return null;
}

export function CreateGameFileModal({
  isOpen,
  gameId,
  gameName,
  mode = "create",
  file = null,
  onClose,
  onSuccess,
}: CreateGameFileModalProps) {
  const isEditMode = mode === "edit" && Boolean(file);
  const [title, setTitle] = useState(file?.title ?? "");
  const [description, setDescription] = useState(file?.description ?? "");
  const [access, setAccess] = useState<GameFileAccess>(
    file?.access ?? "PLAYER"
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const submitDisabled = useMemo(
    () => submitting || !title.trim() || (!isEditMode && selectedFile == null),
    [isEditMode, selectedFile, submitting, title]
  );

  const reset = useCallback(() => {
    setTitle(file?.title ?? "");
    setDescription(file?.description ?? "");
    setAccess(file?.access ?? "PLAYER");
    setError(null);
    setSelectedFile(null);
  }, [file]);

  const handleClose = useCallback(() => {
    if (submitting) return;
    reset();
    onClose();
  }, [onClose, reset, submitting]);

  const selectFile = useCallback((candidate: File | null) => {
    if (!candidate) return;
    const kind = gameFileKindFromFile(candidate);
    if (kind == null) {
      setError("Please choose an image (PNG, JPEG, GIF, WebP) or a PDF.");
      return;
    }
    if (kind === "PDF" && candidate.size > PDF_MAX_SIZE_BYTES) {
      setError(`PDF must be ${PDF_MAX_SIZE_LABEL} or smaller.`);
      return;
    }
    if (kind === "IMAGE" && candidate.size > DOCUMENT_IMAGE_MAX_SIZE_BYTES) {
      setError(`Image must be ${DOCUMENT_IMAGE_MAX_SIZE_LABEL} or smaller.`);
      return;
    }
    setError(null);
    setSelectedFile(candidate);
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    let uploadedFileKey: string | null = null;
    let uploadedThumbnailKey: string | null = null;
    try {
      setSubmitting(true);
      setError(null);
      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim() || null;
      const metadata = {
        title: trimmedTitle,
        description: trimmedDescription,
        access,
      };

      if (selectedFile) {
        const kind = gameFileKindFromFile(selectedFile);
        if (kind == null) {
          setError("Please choose an image (PNG, JPEG, GIF, WebP) or a PDF.");
          return;
        }
        const { fileKey, uploadUrl, thumbnailFileKey, thumbnailUploadUrl } =
          await requestGameFileUploadUrl({
            gameId,
            fileName: selectedFile.name,
            fileSizeBytes: selectedFile.size,
            kind,
          });
        uploadedFileKey = fileKey;
        await uploadGameFileToStorage(uploadUrl, selectedFile);
        const thumbnailKey =
          kind === "PDF"
            ? await tryUploadPdfPage1Thumbnail({
                pdf: selectedFile,
                thumbnailFileKey,
                thumbnailUploadUrl,
              })
            : undefined;
        uploadedThumbnailKey = thumbnailKey ?? null;
        const filePayload = {
          ...metadata,
          kind,
          fileKey,
          fileName: selectedFile.name,
          fileSizeBytes: selectedFile.size,
          thumbnailKey: thumbnailKey ?? null,
        };
        if (isEditMode && file) {
          await updateGameFile(gameId, file.id, filePayload);
        } else {
          await createGameFile(gameId, filePayload);
        }
      } else if (isEditMode && file) {
        await updateGameFile(gameId, file.id, metadata);
      } else {
        setError("An image or PDF file is required.");
        return;
      }

      reset();
      onClose();
      onSuccess?.();
    } catch (err) {
      if (uploadedFileKey) {
        void deleteUploadedGameFile(uploadedFileKey);
      }
      if (uploadedThumbnailKey) {
        void deleteUploadedGameFile(uploadedThumbnailKey);
      }
      setError(
        err instanceof Error
          ? err.message
          : isEditMode
            ? "Could not update file."
            : "Could not upload file."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GameFormModal
      isOpen={isOpen}
      title={
        isEditMode ? `Edit file — ${gameName}` : `Upload file — ${gameName}`
      }
      subtitle={
        isEditMode
          ? "Update the title, access, or replace the image or PDF."
          : "Upload an image or PDF. Choose whether players can see it, or keep it GM only."
      }
      titleId={isEditMode ? "edit-game-file-title" : "create-game-file-title"}
      error={error}
      onClose={handleClose}
      onSubmit={(event) => void handleSubmit(event)}
      submitting={submitting}
      submitLabel={isEditMode ? "Save changes" : "Upload file"}
      submittingLabel={isEditMode ? "Saving…" : "Uploading…"}
      submitDisabled={submitDisabled}
    >
      <div>
        <FieldLabel id="game-file-title" label="Title" required />
        <TextField
          id="game-file-title"
          type="text"
          variant="dark"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Industrial compound map"
          disabled={submitting}
        />
      </div>
      <div>
        <FieldLabel id="game-file-description" label="Description" />
        <TextArea
          id="game-file-description"
          variant="dark"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-[88px]"
          placeholder="Optional short description"
          rows={3}
          disabled={submitting}
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-bold text-white lg:text-center">
          Access
        </p>
        <RadioGroup
          name="game-file-access"
          value={access}
          onChange={(value) => setAccess(value as GameFileAccess)}
          options={[
            { value: "PLAYER", label: "Player" },
            { value: "GAME_MASTER", label: "Game master" },
          ]}
          tone="inverse"
          variant="boxed"
          disabled={submitting}
        />
      </div>
      <div>
        <FieldLabel
          id="game-file-file"
          label={isEditMode ? "File (optional replace)" : "File"}
          required={!isEditMode}
        />
        <FilePicker
          id="game-file-file"
          chrome="dropzone"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.pdf"
          disabled={submitting}
          dropzoneLabel="Upload an image or PDF by dropping a file or choosing one"
          hint={`Image (max ${DOCUMENT_IMAGE_MAX_SIZE_LABEL}) or PDF (max ${PDF_MAX_SIZE_LABEL})`}
          onFile={selectFile}
        />
        {selectedFile ? (
          <ChosenFileName
            label="Selected"
            fileName={selectedFile.name}
            fileSizeBytes={selectedFile.size}
          />
        ) : isEditMode && file ? (
          <ChosenFileName
            label="Current file"
            fileName={file.fileName}
            fileSizeBytes={file.fileSizeBytes}
          />
        ) : null}
      </div>
    </GameFormModal>
  );
}
