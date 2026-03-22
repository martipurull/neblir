// eslint-disable-next-line no-unused-expressions
"use client";

import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import React from "react";
import DangerButton from "./DangerButton";
import { SafeButton } from "./SemanticActionButton";

interface DangerConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

const DangerConfirmModal: React.FC<DangerConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  isSubmitting = false,
  errorMessage = null,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="danger-confirm-title"
    >
      <div className="w-full max-w-md rounded-lg border border-black bg-white/95 p-5 shadow-lg backdrop-blur-sm sm:p-6">
        <h2
          id="danger-confirm-title"
          className="text-lg font-semibold text-black"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-black">{description}</p>
        {errorMessage && (
          <p className="mt-3 break-words text-sm text-neblirDanger-600">
            Error: {getUserSafeErrorMessage(errorMessage)}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <SafeButton
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="!px-3 !py-2"
          >
            {cancelLabel}
          </SafeButton>
          <DangerButton
            text={isSubmitting ? "Deleting..." : confirmLabel}
            onClick={() => {
              void onConfirm();
            }}
            className="disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default DangerConfirmModal;
