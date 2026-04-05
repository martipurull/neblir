"use client";

import Link from "next/link";
import React from "react";

export interface CharacterNameActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
}

export function CharacterNameActionsModal({
  isOpen,
  onClose,
  characterId,
}: CharacterNameActionsModalProps) {
  if (!isOpen) return null;

  const base =
    "block w-full rounded-md border-2 border-white/40 bg-modalBackground-200 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-modalBackground-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Character actions"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-lg border-2 border-white bg-modalBackground-200 p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white transition-colors hover:bg-paleBlue/10"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="-mt-1 flex flex-col gap-2 pb-1">
          <Link
            href={`/home/characters/${characterId}/update`}
            className={base}
            onClick={onClose}
          >
            Update Character
          </Link>
          <Link
            href={`/home/characters/${characterId}/level-up`}
            className={base}
            onClick={onClose}
          >
            Level Up
          </Link>
        </div>
      </div>
    </div>
  );
}
