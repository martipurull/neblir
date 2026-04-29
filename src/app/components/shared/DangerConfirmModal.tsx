"use client";

import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import React from "react";
import Button from "./Button";

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
    : "border-black bg-paleBlue/95 backdrop-blur-sm";
  const titleClass = isModalBg ? "text-paleBlue" : "text-black";
  const bodyClass = isModalBg ? "text-paleBlue/85" : "text-black";
  const errorClass = isModalBg
    ? "text-neblirDanger-400"
    : "text-neblirDanger-600";
  const headerBorder = isModalBg ? "border-paleBlue/25" : "border-black/15";
  const footerBorder = headerBorder;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="danger-confirm-title"
      onClick={isSubmitting ? undefined : onCancel}
    >
      <div
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg border p-0 shadow-lg sm:p-0 ${panelSurface} ${panelClassName ?? "max-w-md"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex shrink-0 items-start justify-between gap-3 border-b px-5 pb-3 pt-5 sm:px-6 sm:pb-4 sm:pt-6 ${headerBorder}`}
        >
          <h2
            id="danger-confirm-title"
            className={`text-lg font-semibold ${titleClass}`}
          >
            {title}
          </h2>
          <Button
            type="button"
            variant={isModalBg ? "modalClosePale" : "modalCloseLight"}
            fullWidth={false}
            className={isModalBg ? undefined : "!text-black"}
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <p className={`text-sm ${bodyClass}`}>{description}</p>
          {errorMessage && (
            <p className={`mt-3 break-words text-sm ${errorClass}`}>
              Error: {getUserSafeErrorMessage(errorMessage)}
            </p>
          )}
        </div>

        <div
          className={`flex shrink-0 flex-wrap justify-end gap-3 border-t px-5 py-4 sm:px-6 ${footerBorder}`}
        >
          <Button
            type="button"
            variant="semanticSafeOutline"
            fullWidth={false}
            onClick={onCancel}
            disabled={isSubmitting}
            className="!px-3 !py-2"
          >
            {cancelLabel}
          </Button>
          <Button
            variant="danger"
            fullWidth={false}
            onClick={() => {
              void onConfirm();
            }}
            className="!px-3 !py-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Deleting..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DangerConfirmModal;
