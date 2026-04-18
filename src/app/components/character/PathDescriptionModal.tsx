"use client";

import Button from "@/app/components/shared/Button";
import type { Path } from "@/app/lib/types/path";
import React from "react";

export interface PathDescriptionModalProps {
  path: Path;
  onClose: () => void;
}

export function PathDescriptionModal({
  path,
  onClose,
}: PathDescriptionModalProps) {
  const titleId = `path-desc-modal-title-${path.id}`;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-lg border border-black bg-modalBackground-200 shadow-lg backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-black/20 px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
          <h2 id={titleId} className="text-base font-semibold text-paleBlue">
            {String(path.name)}
          </h2>
          <Button
            type="button"
            variant="modalClosePale"
            fullWidth={false}
            onClick={onClose}
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          {path.description && (
            <p className="text-sm leading-relaxed text-paleBlue">
              {path.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
