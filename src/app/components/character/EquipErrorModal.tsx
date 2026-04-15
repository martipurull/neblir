"use client";

import { SafeButton } from "@/app/components/shared/SemanticActionButton";
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="equip-error-title"
      aria-describedby="equip-error-desc"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-lg border-2 border-white bg-modalBackground-200 p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="equip-error-title" className="text-lg font-semibold text-white">
          {title}
        </h2>
        <p
          id="equip-error-desc"
          className="mt-3 text-sm leading-snug text-white/85"
        >
          {message}
        </p>
        <SafeButton type="button" className="mt-5 w-full" onClick={onClose}>
          OK
        </SafeButton>
      </div>
    </div>
  );
}
