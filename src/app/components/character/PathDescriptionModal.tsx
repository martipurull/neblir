"use client";

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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-black bg-modalBackground-200 p-4 shadow-lg backdrop-blur-sm sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-base font-semibold text-paleBlue">
            {String(path.name)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded p-1 text-paleBlue transition-colors hover:bg-black/10"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        {path.description && (
          <p className="mt-3 text-sm leading-relaxed text-paleBlue">
            {path.description}
          </p>
        )}
      </div>
    </div>
  );
}
