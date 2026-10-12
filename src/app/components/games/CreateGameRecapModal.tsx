"use client";

import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { ChosenFileName } from "@/app/components/shared/ChosenFileName";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { FilePicker } from "@/app/components/shared/FilePicker";
import { TextField } from "@/app/components/shared/TextField";
import { TextArea } from "@/app/components/shared/TextArea";
import {
  PDF_MAX_SIZE_BYTES,
  PDF_MAX_SIZE_LABEL,
} from "@/app/lib/constants/uploadLimits";
import { tryUploadPdfPage1Thumbnail } from "@/app/lib/pdfPage1Thumbnail";
import type { GameRecap } from "@/app/lib/types/recap";
import {
  createGameRecap,
  deleteUploadedRecapFile,
  requestRecapUploadUrl,
  updateGameRecap,
  uploadRecapPdfToStorage,
} from "@/lib/api/recaps";
import { type FormEvent, useMemo, useState } from "react";

type CreateGameRecapModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  mode?: "create" | "edit";
  recap?: GameRecap | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function CreateGameRecapModal({
  isOpen,
  gameId,
  gameName,
  mode = "create",
  recap = null,
  onClose,
  onSuccess,
}: CreateGameRecapModalProps) {
  const isEditMode = mode === "edit" && Boolean(recap);
  const [title, setTitle] = useState(recap?.title ?? "");
  const [summary, setSummary] = useState(recap?.summary ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submitDisabled = useMemo(
    () => submitting || !title.trim() || (!isEditMode && !file),
    [file, isEditMode, submitting, title]
  );

  const resetForm = () => {
    setTitle(recap?.title ?? "");
    setSummary(recap?.summary ?? "");
    setFile(null);
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!isEditMode && !file) {
      setError("PDF file is required.");
      return;
    }
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are allowed.");
        return;
      }
      if (file.size > PDF_MAX_SIZE_BYTES) {
        setError(`PDF must be ${PDF_MAX_SIZE_LABEL} or smaller.`);
        return;
      }
    }

    let uploadedKey: string | null = null;
    let uploadedThumbnailKey: string | null = null;
    try {
      setSubmitting(true);
      setError(null);

      const trimmedTitle = title.trim();
      const trimmedSummary = summary.trim() || null;

      if (isEditMode && recap) {
        if (file) {
          const { fileKey, uploadUrl, thumbnailFileKey, thumbnailUploadUrl } =
            await requestRecapUploadUrl({
              gameId,
              fileName: file.name,
              fileSizeBytes: file.size,
            });
          uploadedKey = fileKey;
          await uploadRecapPdfToStorage(uploadUrl, file);
          const thumbnailKey = await tryUploadPdfPage1Thumbnail({
            pdf: file,
            thumbnailFileKey,
            thumbnailUploadUrl,
          });
          uploadedThumbnailKey = thumbnailKey ?? null;
          await updateGameRecap(gameId, recap.id, {
            title: trimmedTitle,
            summary: trimmedSummary,
            fileKey,
            fileName: file.name,
            fileSizeBytes: file.size,
            thumbnailKey: thumbnailKey ?? null,
          });
        } else {
          await updateGameRecap(gameId, recap.id, {
            title: trimmedTitle,
            summary: trimmedSummary,
          });
        }
      } else {
        if (!file) {
          setError("PDF file is required.");
          return;
        }
        const { fileKey, uploadUrl, thumbnailFileKey, thumbnailUploadUrl } =
          await requestRecapUploadUrl({
            gameId,
            fileName: file.name,
            fileSizeBytes: file.size,
          });
        uploadedKey = fileKey;
        await uploadRecapPdfToStorage(uploadUrl, file);
        const thumbnailKey = await tryUploadPdfPage1Thumbnail({
          pdf: file,
          thumbnailFileKey,
          thumbnailUploadUrl,
        });
        uploadedThumbnailKey = thumbnailKey ?? null;
        await createGameRecap(gameId, {
          title: trimmedTitle,
          summary: trimmedSummary,
          fileKey,
          fileName: file.name,
          fileSizeBytes: file.size,
          ...(thumbnailKey ? { thumbnailKey } : {}),
        });
      }

      resetForm();
      onClose();
      onSuccess?.();
    } catch (err) {
      if (uploadedKey) {
        void deleteUploadedRecapFile(uploadedKey);
      }
      if (uploadedThumbnailKey) {
        void deleteUploadedRecapFile(uploadedThumbnailKey);
      }
      setError(
        err instanceof Error
          ? err.message
          : isEditMode
            ? "Could not update recap."
            : "Could not upload recap."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectPdfFile = (candidate: File | null) => {
    if (!candidate) return;
    if (candidate.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }
    if (candidate.size > PDF_MAX_SIZE_BYTES) {
      setError(`PDF must be ${PDF_MAX_SIZE_LABEL} or smaller.`);
      return;
    }
    setError(null);
    setFile(candidate);
  };

  return (
    <GameFormModal
      isOpen={isOpen}
      title={
        isEditMode ? `Edit recap — ${gameName}` : `Upload recap — ${gameName}`
      }
      subtitle={
        isEditMode
          ? "Update the title, summary, or replace the PDF."
          : "Upload a session PDF players can download from the game page."
      }
      titleId={isEditMode ? "edit-game-recap-title" : "create-game-recap-title"}
      error={error}
      onClose={handleClose}
      onSubmit={(event) => void handleSubmit(event)}
      submitting={submitting}
      submitLabel={isEditMode ? "Save changes" : "Upload recap"}
      submittingLabel={isEditMode ? "Saving…" : "Uploading…"}
      submitDisabled={submitDisabled}
    >
      <div>
        <FieldLabel id="game-recap-title" label="Title" required />
        <TextField
          id="game-recap-title"
          type="text"
          variant="dark"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Session 14 - The Red Vault"
          disabled={submitting}
        />
      </div>
      <div>
        <FieldLabel id="game-recap-summary" label="Summary" />
        <TextArea
          id="game-recap-summary"
          variant="dark"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          className="min-h-[88px]"
          placeholder="Optional short summary"
          rows={3}
          disabled={submitting}
        />
      </div>
      <div>
        <FieldLabel
          id="game-recap-file"
          label={isEditMode ? "PDF file (optional replace)" : "PDF file"}
          required={!isEditMode}
        />
        <FilePicker
          id="game-recap-file"
          chrome="dropzone"
          accept="application/pdf,.pdf"
          disabled={submitting}
          dropzoneLabel="Upload recap PDF by dropping a file or choosing one"
          hint={`or drag and drop a PDF here (max ${PDF_MAX_SIZE_LABEL})`}
          onFile={selectPdfFile}
        />
        {file ? (
          <ChosenFileName
            label="Selected"
            fileName={file.name}
            fileSizeBytes={file.size}
          />
        ) : isEditMode && recap ? (
          <ChosenFileName
            label="Current file"
            fileName={recap.fileName}
            fileSizeBytes={recap.fileSizeBytes}
          />
        ) : null}
      </div>
    </GameFormModal>
  );
}
