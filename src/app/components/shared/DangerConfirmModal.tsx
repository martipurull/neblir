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
  /** Overrides default `max-w-md` on the panel (e.g. `max-w-xs` for a compact dialog). */
  panelClassName?: string;
  /** `modalBackground` matches character note modals (purple panel, pale blue text). */
  variant?: "default" | "modalBackground";
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
  panelClassName,
  variant = "default",
}) => {
  if (!isOpen) {
    return null;
  }

  const isModalBg = variant === "modalBackground";
  const panelSurface = isModalBg
    ? "border-paleBlue/25 bg-modalBackground-200"
    : "border-black bg-white/95 backdrop-blur-sm";
  const titleClass = isModalBg ? "text-paleBlue" : "text-black";
  const bodyClass = isModalBg ? "text-paleBlue/85" : "text-black";
  const errorClass = isModalBg
    ? "text-neblirDanger-400"
    : "text-neblirDanger-600";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="danger-confirm-title"
    >
      <div
        className={`w-full rounded-lg border p-5 shadow-lg sm:p-6 ${panelSurface} ${panelClassName ?? "max-w-md"}`}
      >
        <h2
          id="danger-confirm-title"
          className={`text-lg font-semibold ${titleClass}`}
        >
          {title}
        </h2>
        <p className={`mt-2 text-sm ${bodyClass}`}>{description}</p>
        {errorMessage && (
          <p className={`mt-3 break-words text-sm ${errorClass}`}>
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
