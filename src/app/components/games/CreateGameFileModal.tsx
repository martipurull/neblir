"use client";

import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { TextField } from "@/app/components/shared/TextField";
import { TextArea } from "@/app/components/shared/TextArea";
import { Button } from "@/app/components/shared/Button";
import { ImageUploadDropzone } from "@/app/components/shared/ImageUploadDropzone";
import {
  IMAGE_MAX_SIZE_BYTES,
  IMAGE_MAX_SIZE_LABEL,
  PDF_MAX_SIZE_BYTES,
  PDF_MAX_SIZE_LABEL,
} from "@/app/lib/constants/uploadLimits";
import { useImageUpload } from "@/hooks/use-image-upload";
import {
  createGameFile,
  deleteUploadedGameFile,
  requestGameFileUploadUrl,
  uploadGameFilePdfToStorage,
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
  onClose: () => void;
  onSuccess?: () => void;
};

function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

export function CreateGameFileModal({
  isOpen,
  gameId,
  gameName,
  onClose,
  onSuccess,
}: CreateGameFileModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageMeta, setImageMeta] = useState<{
    fileName: string;
    fileSizeBytes: number;
  } | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const imageUpload = useImageUpload("files");
  const {
    imageKey,
    pendingImageKey,
    deleteUploadedImage,
    reset: resetImageUpload,
  } = imageUpload;

  const submitDisabled = useMemo(
    () => submitting || !title.trim() || (!imageKey && !pdfFile),
    [imageKey, pdfFile, submitting, title]
  );

  const reset = useCallback(() => {
    setTitle("");
    setDescription("");
    setError(null);
    setPdfFile(null);
    setImageMeta(null);
    resetImageUpload();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [resetImageUpload]);

  const handleClose = useCallback(() => {
    if (submitting) return;
    if (pendingImageKey) {
      void deleteUploadedImage(pendingImageKey);
    }
    reset();
    onClose();
  }, [deleteUploadedImage, onClose, pendingImageKey, reset, submitting]);

  const selectFile = useCallback(
    (candidate: File | null) => {
      if (!candidate) return;
      if (isPdfFile(candidate)) {
        if (candidate.size > PDF_MAX_SIZE_BYTES) {
          setError(`PDF must be ${PDF_MAX_SIZE_LABEL} or smaller.`);
          return;
        }
        if (pendingImageKey) {
          void deleteUploadedImage(pendingImageKey);
        }
        resetImageUpload();
        setImageMeta(null);
        setError(null);
        setPdfFile(candidate);
        return;
      }
      if (!candidate.type.startsWith("image/")) {
        setError("Please choose an image (PNG, JPEG, GIF, WebP) or a PDF.");
        return;
      }
      if (candidate.size > IMAGE_MAX_SIZE_BYTES) {
        setError(`Image must be ${IMAGE_MAX_SIZE_LABEL} or smaller.`);
        return;
      }
      setPdfFile(null);
      setImageMeta({ fileName: candidate.name, fileSizeBytes: candidate.size });
      void imageUpload.handleFile(candidate);
    },
    [deleteUploadedImage, imageUpload, pendingImageKey, resetImageUpload]
  );

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

    let uploadedPdfKey: string | null = null;
    try {
      setSubmitting(true);
      setError(null);
      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim() || null;

      if (pdfFile) {
        const { fileKey, uploadUrl } = await requestGameFileUploadUrl({
          gameId,
          fileName: pdfFile.name,
          fileSizeBytes: pdfFile.size,
          kind: "PDF",
        });
        uploadedPdfKey = fileKey;
        await uploadGameFilePdfToStorage(uploadUrl, pdfFile);
        await createGameFile(gameId, {
          title: trimmedTitle,
          description: trimmedDescription,
          kind: "PDF",
          fileKey,
          fileName: pdfFile.name,
          fileSizeBytes: pdfFile.size,
        });
      } else if (imageKey && imageMeta) {
        await createGameFile(gameId, {
          title: trimmedTitle,
          description: trimmedDescription,
          kind: "IMAGE",
          fileKey: imageKey,
          fileName: imageMeta.fileName,
          fileSizeBytes: imageMeta.fileSizeBytes,
        });
      } else {
        setError("An image or PDF file is required.");
        return;
      }

      reset();
      onClose();
      onSuccess?.();
    } catch (err) {
      if (uploadedPdfKey) {
        void deleteUploadedGameFile(uploadedPdfKey);
      }
      setError(err instanceof Error ? err.message : "Could not upload file.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GameFormModal
      isOpen={isOpen}
      title={`Upload file — ${gameName}`}
      subtitle="Upload an image or PDF for players to view and download."
      titleId="create-game-file-title"
      error={error}
      onClose={handleClose}
      onSubmit={(event) => void handleSubmit(event)}
      submitting={submitting}
      submitLabel="Upload file"
      submittingLabel="Uploading…"
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
      {imageKey ? (
        <ImageUploadDropzone
          id="game-file-image"
          label="Image file"
          imageKey={imageKey}
          onFileChange={(file) => selectFile(file)}
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
          uploading={imageUpload.uploading}
          error={imageUpload.uploadError}
          disabled={submitting}
          previewLayout="cover"
          previewImageAlt={title.trim() ? `${title.trim()} image` : "Game file"}
          previewCaption="Image preview — this is how players will see this visual."
        />
      ) : (
        <div>
          <FieldLabel id="game-file-file" label="File" required />
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
                Image (max {IMAGE_MAX_SIZE_LABEL}) or PDF (max{" "}
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
          {pdfFile ? (
            <p className="mt-1 text-xs text-white/70">
              Selected: {pdfFile.name} ({Math.ceil(pdfFile.size / 1024)} KB)
            </p>
          ) : null}
        </div>
      )}
    </GameFormModal>
  );
}
