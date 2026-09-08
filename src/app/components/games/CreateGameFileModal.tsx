"use client";

import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { TextField } from "@/app/components/shared/TextField";
import { TextArea } from "@/app/components/shared/TextArea";
import { Button } from "@/app/components/shared/Button";
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
import type { GameFile, GameFileAccess } from "@/app/lib/types/gameFile";
import {
  createGameFile,
  deleteUploadedGameFile,
  requestGameFileUploadUrl,
  updateGameFile,
  uploadGameFileToStorage,
} from "@/lib/api/gameFiles";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";

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
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      setIsDragActive(false);
      const dropped = event.dataTransfer.files?.[0] ?? null;
      selectFile(dropped);
    },
    [selectFile]
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    let uploadedFileKey: string | null = null;
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
        const { fileKey, uploadUrl } = await requestGameFileUploadUrl({
          gameId,
          fileName: selectedFile.name,
          fileSizeBytes: selectedFile.size,
          kind,
        });
        uploadedFileKey = fileKey;
        await uploadGameFileToStorage(uploadUrl, selectedFile);
        const filePayload = {
          ...metadata,
          kind,
          fileKey,
          fileName: selectedFile.name,
          fileSizeBytes: selectedFile.size,
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
          onDrop={handleDrop}
          className={`rounded-md border-2 border-dashed px-4 py-4 transition-colors ${
            isDragActive
              ? "border-paleBlue bg-paleBlue/10"
              : "border-white/40 bg-transparent"
          }`}
          aria-label="Upload an image or PDF by dropping a file or choosing one"
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
              Image (max {DOCUMENT_IMAGE_MAX_SIZE_LABEL}) or PDF (max{" "}
              {PDF_MAX_SIZE_LABEL})
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          id="game-file-file"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.pdf"
          disabled={submitting}
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            selectFile(nextFile);
            event.target.value = "";
          }}
          className="sr-only"
        />
        {selectedFile ? (
          <p className="mt-1 text-xs text-white/70">
            Selected: {selectedFile.name} ({Math.ceil(selectedFile.size / 1024)}{" "}
            KB)
          </p>
        ) : isEditMode && file ? (
          <p className="mt-1 text-xs text-white/70">
            Current file: {file.fileName} (
            {Math.ceil(file.fileSizeBytes / 1024)} KB)
          </p>
        ) : null}
      </div>
    </GameFormModal>
  );
}
