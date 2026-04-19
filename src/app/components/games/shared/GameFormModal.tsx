"use client";

import Button from "@/app/components/shared/Button";
import React from "react";

const FORM_ID = "game-form-modal-form";

type GameFormModalProps = {
  isOpen: boolean;
  title: string;
  subtitle: React.ReactNode;
  titleId: string;
  children: React.ReactNode;
  error: string | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  cancelLabel?: string;
  submitLabel: string;
  /** Shown when submitting is true; defaults to "Saving…" */
  submittingLabel?: string;
  submitDisabled?: boolean;
};

export function GameFormModal({
  isOpen,
  title,
  subtitle,
  titleId,
  children,
  error,
  onClose,
  onSubmit,
  submitting,
  cancelLabel = "Cancel",
  submitLabel,
  submittingLabel = "Saving…",
  submitDisabled = false,
}: GameFormModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={submitting ? undefined : onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border-2 border-white bg-modalBackground-200 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/20 p-4 sm:p-5">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-white">
              {title}
            </h2>
            <p className="mt-1 text-sm text-white/80">{subtitle}</p>
          </div>
          <Button
            type="button"
            variant="modalClose"
            fullWidth={false}
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </Button>
        </div>

        <form
          id={FORM_ID}
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
            {children}
          </div>
        </form>

        {error && (
          <div className="shrink-0 px-4 sm:px-5">
            <p className="text-sm text-neblirDanger-400">{error}</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-3 border-t border-white/20 p-4 sm:p-5">
          <Button
            type="button"
            variant="modalFooterSecondary"
            fullWidth={false}
            className="font-medium"
            onClick={onClose}
            disabled={submitting}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="modalFooterPrimary"
            fullWidth={false}
            disabled={submitting || submitDisabled}
          >
            {submitting ? submittingLabel : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
