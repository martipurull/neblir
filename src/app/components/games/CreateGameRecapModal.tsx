"use client";

import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { ModalFieldLabel } from "@/app/components/games/shared/ModalFieldLabel";
import { modalInputClass } from "@/app/components/games/shared/modalStyles";
import Button from "@/app/components/shared/Button";
import { createGameRecap } from "@/lib/api/recaps";
import React, { useMemo, useRef, useState } from "react";

type CreateGameRecapModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  onClose: () => void;
  onSuccess?: () => void;
};

async function uploadRecapFile(file: File): Promise<{ fileKey: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/upload-file?type=recaps", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(body.message ?? "Failed to upload recap file");
  }
  const data = (await response.json()) as { fileKey?: string };
  if (!data.fileKey) {
    throw new Error("Upload succeeded but no file key was returned.");
  }
  return { fileKey: data.fileKey };
}

async function deleteUploadedRecapFile(fileKey: string): Promise<void> {
  await fetch(`/api/upload-file?fileKey=${encodeURIComponent(fileKey)}`, {
    method: "DELETE",
  });
}

export default function CreateGameRecapModal({
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("PDF file is required.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }

    let uploadedKey: string | null = null;
    try {
      setSubmitting(true);
      setError(null);

      const upload = await uploadRecapFile(file);
      uploadedKey = upload.fileKey;

      await createGameRecap(gameId, {
        title: title.trim(),
        summary: summary.trim() || null,
        fileKey: upload.fileKey,
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
        <ModalFieldLabel id="game-recap-title" label="Title" required />
        <input
          id="game-recap-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={modalInputClass}
          placeholder="e.g. Session 14 - The Red Vault"
          disabled={submitting}
        />
      </div>
      <div>
        <ModalFieldLabel id="game-recap-summary" label="Summary" />
        <textarea
          id="game-recap-summary"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          className={`${modalInputClass} min-h-[88px]`}
          placeholder="Optional short summary"
          rows={3}
          disabled={submitting}
        />
      </div>
      <div>
        <ModalFieldLabel id="game-recap-file" label="PDF file" required />
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
            <p className="text-xs text-white/80">or drag and drop a PDF here</p>
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
