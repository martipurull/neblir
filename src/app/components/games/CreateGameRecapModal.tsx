"use client";

import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { TextField } from "@/app/components/shared/TextField";
import { Button } from "@/app/components/shared/Button";
import { TextArea } from "@/app/components/shared/TextArea";
import {
  RECAP_MAX_SIZE_BYTES,
  RECAP_MAX_SIZE_LABEL,
} from "@/app/lib/constants/uploadLimits";
import {
  createGameRecap,
  deleteUploadedRecapFile,
  requestRecapUploadUrl,
  uploadRecapPdfToStorage,
} from "@/lib/api/recaps";
import { type FormEvent, useMemo, useRef, useState } from "react";

type CreateGameRecapModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function CreateGameRecapModal({
  isOpen,
  gameId,
  gameName,
  onClose,
  onSuccess,
}: CreateGameRecapModalProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const submitDisabled = useMemo(
    () => submitting || !title.trim() || !file,
    [file, submitting, title]
  );

  const resetForm = () => {
    setTitle("");
    setSummary("");
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
    if (!file) {
      setError("PDF file is required.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }
    if (file.size > RECAP_MAX_SIZE_BYTES) {
      setError(`PDF must be ${RECAP_MAX_SIZE_LABEL} or smaller.`);
      return;
    }

    let uploadedKey: string | null = null;
    try {
      setSubmitting(true);
      setError(null);

      const { fileKey, uploadUrl } = await requestRecapUploadUrl({
        gameId,
        fileName: file.name,
        fileSizeBytes: file.size,
      });
      uploadedKey = fileKey;

      await uploadRecapPdfToStorage(uploadUrl, file);

      await createGameRecap(gameId, {
        title: title.trim(),
        summary: summary.trim() || null,
        fileKey,
        fileName: file.name,
        fileSizeBytes: file.size,
      });

      resetForm();
      onClose();
      onSuccess?.();
    } catch (err) {
      if (uploadedKey) {
        void deleteUploadedRecapFile(uploadedKey);
      }
      setError(err instanceof Error ? err.message : "Could not upload recap.");
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
    if (candidate.size > RECAP_MAX_SIZE_BYTES) {
      setError(`PDF must be ${RECAP_MAX_SIZE_LABEL} or smaller.`);
      return;
    }
    setError(null);
    setFile(candidate);
  };

  return (
    <GameFormModal
      isOpen={isOpen}
      title={`Upload recap — ${gameName}`}
      subtitle="Upload a session PDF players can download from the game page."
      titleId="create-game-recap-title"
      error={error}
      onClose={handleClose}
      onSubmit={(event) => void handleSubmit(event)}
      submitting={submitting}
      submitLabel="Upload recap"
      submittingLabel="Uploading…"
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
        <FieldLabel id="game-recap-file" label="PDF file" required />
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
            selectPdfFile(dropped);
          }}
          className={`rounded-md border-2 border-dashed px-4 py-4 transition-colors ${
            isDragActive
              ? "border-paleBlue bg-paleBlue/10"
              : "border-white/40 bg-transparent"
          }`}
          aria-label="Upload recap PDF by dropping a file or choosing one"
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
              or drag and drop a PDF here (max {RECAP_MAX_SIZE_LABEL})
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          id="game-recap-file"
          type="file"
          accept="application/pdf,.pdf"
          disabled={submitting}
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            selectPdfFile(nextFile);
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
