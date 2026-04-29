"use client";

import Button from "@/app/components/shared/Button";
import React from "react";

export interface EquipErrorModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export function EquipErrorModal({
  isOpen,
  title = "Can't equip",
  message,
  onClose,
}: EquipErrorModalProps) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="equip-error-title"
      aria-describedby="equip-error-desc"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-lg border-2 border-white bg-modalBackground-200 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/20 px-5 pb-3 pt-5">
          <h2
            id="equip-error-title"
            className="text-lg font-semibold text-white"
          >
            {title}
          </h2>
          <Button
            type="button"
            variant="modalClose"
            fullWidth={false}
            onClick={onClose}
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
          <p
            id="equip-error-desc"
            className="text-sm leading-snug text-white/85"
          >
            {message}
          </p>
          <Button
            type="button"
            variant="semanticSafeOutline"
            className="mt-5 w-full"
            onClick={onClose}
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}
